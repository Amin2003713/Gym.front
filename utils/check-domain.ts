import { API_URL } from '@/configs/global'
import { Problem } from '@/types/http-errors.interface'

const domainCache = new Map<string, { value: boolean; timeout: NodeJS.Timeout }>()

export const checkDomain = async (domain: string | undefined): Promise<boolean | undefined> => {
  if (!domain) return false

  if (domainCache.has(domain)) {
    return domainCache.get(domain)?.value
  }

  try {
    const res = await fetch(`https://${API_URL}/api/panel/check-domain?domain=${domain}`, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Type': 'Browser',
      },
    })
    const domainStatus: { exist: boolean } = await res.json()

    const timeout = setTimeout(() => domainCache.delete(domain), 10 * 60 * 1000)
    domainCache.set(domain, { value: domainStatus.exist, timeout })

    return domainStatus.exist
  } catch (err: unknown) {
    const error = err as Problem
    console.log('error', { error })
  }
}
