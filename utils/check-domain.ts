import { API_URL } from '@/configs/global'

/**
 * `true`  — the tenant exists.
 * `false` — the API answered and the tenant does not exist (or the slug is invalid).
 * `null`  — unknown: the request could not reach the API (VPN/proxy hiccup, 502, timeout).
 *
 * Callers must treat `null` as "do not block": a flaky connection must never bounce a real gym
 * to the signup page.
 */
export type DomainCheckResult = boolean | null

const CACHE_TTL_MS = 10 * 60 * 1000
const FAILURE_BACKOFF_MS = 30 * 1000

const domainCache = new Map<string, { value: boolean; checkedAt: number }>()
const inFlight = new Map<string, Promise<DomainCheckResult>>()
const lastFailureAt = new Map<string, number>()

const getApiBaseUrl = (): string | null => {
  const configured = API_URL?.trim()
  if (!configured) return null

  // NEXT_PUBLIC_API_URL may be configured as either a hostname or a full URL. Match the Axios
  // client: HTTPS unless it is a local host (an http call to a TLS-only API is one of the
  // "fetch failed" cases this check must survive).
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(configured)
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(configured)
    ? configured
    : `${isLocal ? 'http' : 'https'}://${configured}`

  return normalized.replace(/\/+$/, '')
}

const requestDomain = async (
  domain: string,
  apiBaseUrl: string,
): Promise<DomainCheckResult> => {
  try {
    const url = new URL('/api/tenant/check-domain', "http://gym:8080")
    url.searchParams.set('domain', domain)

    const res = await fetch(url, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Device-Type': 'Browser',
      },
    })

    if (!res.ok) {
      // A rejected slug is a real answer; a gateway/proxy failure is not.
      if (res.status === 400 || res.status === 404) return false

      console.warn('Tenant domain check returned an HTTP error.', {
        status: res.status,
        endpoint: url.pathname,
      })
      return null
    }

    const payload = (await res.json()) as { exist?: boolean }
    const exists = payload.exist === true

    domainCache.set(domain, { value: exists, checkedAt: Date.now() })
    return exists
  } catch (error) {
    console.warn('Tenant domain check request failed.', { error })
    return null
  }
}

export const checkDomain = async (
  domain: string | undefined,
  options?: { force?: boolean },
): Promise<DomainCheckResult> => {
  const normalizedDomain = domain?.trim().toLowerCase()
  if (!normalizedDomain) return false

  const cached = domainCache.get(normalizedDomain)
  // A positive answer is stable; a negative one expires quickly so a freshly created gym works
  // within a minute.
  const ttl = cached?.value ? CACHE_TTL_MS : 60_000
  const isFresh = cached && Date.now() - cached.checkedAt < ttl
  if (isFresh && !options?.force) return cached.value

  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    console.error('Tenant domain check failed: NEXT_PUBLIC_API_URL is not configured.')
    return cached?.value ?? null
  }

  // One request per domain even when a page fires many navigations at once.
  const pending = inFlight.get(normalizedDomain)
  if (pending) return pending

  const failedAt = lastFailureAt.get(normalizedDomain) ?? 0
  if (!cached && Date.now() - failedAt < FAILURE_BACKOFF_MS) return null

  const request = requestDomain(normalizedDomain, apiBaseUrl)
    .then((value) => {
      if (value === null) {
        lastFailureAt.set(normalizedDomain, Date.now())
        // Keep answering with the last known value instead of forgetting the tenant.
        return cached?.value ?? null
      }

      lastFailureAt.delete(normalizedDomain)
      return value
    })
    .finally(() => inFlight.delete(normalizedDomain))

  inFlight.set(normalizedDomain, request)
  return request
}
