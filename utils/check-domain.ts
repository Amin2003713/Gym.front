import { API_URL } from '@/configs/global'
import { Problem } from '@/types/http-errors.interface'
import { log } from 'console';

const domainCache = new Map<string, { value: boolean; timeout: NodeJS.Timeout }>()

const getApiBaseUrl = (): string | null => {
  const configured = API_URL?.trim()
  if (!configured) return null

  // NEXT_PUBLIC_API_URL may be configured as either a hostname or a full URL.
  // Do not prepend https:// to an already-qualified URL.
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(configured)
    ? configured
    : `http://${configured}`

  return normalized.replace(/\/+$/, '')
}

export const checkDomain = async (domain: string | undefined): Promise<boolean> => {
  const normalizedDomain = domain?.trim().toLowerCase()
  if (!normalizedDomain) return false

  const cached = domainCache.get(normalizedDomain)
  if (cached) return cached.value

  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    console.error('Tenant domain check failed: NEXT_PUBLIC_API_URL is not configured.')
    return false
  }

  try {
    const url = new URL('/api/tenant/check-domain', apiBaseUrl)
    url.searchParams.set('domain', normalizedDomain)

    const res = await fetch(url, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Device-Type': 'Browser',
      },
    })

    if (!res.ok) {
      console.error('Tenant domain check returned an HTTP error.', {
        status: res.status,
        endpoint: url.pathname,
      })
        console.log(res)
      return false
    }

    const domainStatus = (await res.json()) as { exist?: boolean }
    const exists = domainStatus.exist === true

    console.log(domainStatus)

    const timeout = setTimeout(() => domainCache.delete(normalizedDomain), 60_000)
    domainCache.set(normalizedDomain, { value: exists, timeout })

    return exists
  } catch (err: unknown) {
    const error = err as Problem
    console.error('Tenant domain check request failed.', { error })
    return false
  }
}
