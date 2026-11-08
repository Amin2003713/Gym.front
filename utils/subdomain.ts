import { API_URL, BASE_DOMAIN } from '@/configs/global'

// Cache Store (Server-side Only)
type CacheRecord = {
  value: boolean
  timeout: NodeJS.Timeout
}

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const domainCache = new Map<string, CacheRecord>()

async function checkSubdomain(subdomain: string): Promise<boolean> {
  if (!subdomain) return false

  const cached = domainCache.get(subdomain)
  if (cached) return cached.value

  try {
    const res = await fetch(
      `https://${API_URL}/api/panel/check-domain?domain=${subdomain}`,
      {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Type': 'Browser',
        },
      },
    )
    // Handle non-200 status
    if (!res.ok) {
      console.warn(`checkSubdomain: Non-200 response for ${subdomain}`)
      return false
    }

    const data = (await res.json()) as { exist?: boolean }
    const exists = Boolean(data.exist)

    const prev = domainCache.get(subdomain)
    if (prev) clearTimeout(prev.timeout)

    // Set cache with TTL
    const timeout = setTimeout(() => {
      domainCache.delete(subdomain)
    }, CACHE_TTL)

    domainCache.set(subdomain, { value: exists, timeout })

    return exists
  } catch {
    return false
  }
}

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]

  // Local development environment
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Fallback to host header approach
    if (hostname.includes('.localhost')) {
      return hostname.split('.')[0]
    }

    return null
  }

  // Production environment
  const rootDomainFormatted = BASE_DOMAIN.split(':')[0]

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`)

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null
}

const SUBDOMAIN_REGEX = /^(?!-)(?!.*--)(?!.*-$)[a-z0-9-]{4,30}$/i

function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain) return false
  return SUBDOMAIN_REGEX.test(subdomain)
}

export { checkSubdomain, extractSubdomain, isValidSubdomain }
