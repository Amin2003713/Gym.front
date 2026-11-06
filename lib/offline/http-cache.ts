import {
  HTTP_CACHE_STORE,
  idbClear,
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
} from './db'

/** Data this old is never shown offline. */
const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000
/** Above this the value is a document/blob, not a screen payload. */
const MAX_ENTRY_BYTES = 750_000
const MAX_ENTRIES = 300
const EVICTION_INTERVAL_MS = 60_000

type HttpCacheEntry<T = unknown> = {
  key: string
  data: T
  storedAt: number
  bytes: number
}

let lastEviction = 0

const stableParams = (params: unknown): string => {
  if (!params) return ''

  try {
    if (params instanceof URLSearchParams) return params.toString()

    if (typeof params === 'object') {
      return JSON.stringify(
        Object.entries(params as Record<string, unknown>)
          .filter(([, value]) => value !== undefined && value !== null)
          .sort(([a], [b]) => a.localeCompare(b)),
      )
    }

    return String(params)
  } catch {
    return ''
  }
}

/**
 * The user and tenant are part of the key so a shared phone cannot show one account's
 * cached screen to the next person who signs in.
 */
export function buildHttpCacheKey(input: {
  baseURL: string
  url: string
  tenant: string | null
  userKey: string
  params?: unknown
}): string {
  return [
    'GET',
    input.baseURL,
    input.tenant ?? '',
    input.userKey,
    input.url,
    stableParams(input.params),
  ].join('|')
}

export async function readHttpCache<T>(
  key: string,
): Promise<{ data: T; storedAt: number } | null> {
  if (!key) return null

  const entry = await idbGet<HttpCacheEntry<T>>(HTTP_CACHE_STORE, key)
  if (!entry) return null

  const age = Date.now() - entry.storedAt
  if (age > MAX_STALE_MS) {
    void idbDelete(HTTP_CACHE_STORE, key)
    return null
  }

  return { data: entry.data, storedAt: entry.storedAt }
}

export async function writeHttpCache<T>(key: string, data: T): Promise<void> {
  if (!key || data === undefined) return

  let serialized = ''
  try {
    serialized = JSON.stringify(data)
  } catch {
    return
  }

  const bytes = serialized.length
  if (bytes === 0 || bytes > MAX_ENTRY_BYTES) return

  await idbPut(HTTP_CACHE_STORE, {
    key,
    data,
    storedAt: Date.now(),
    bytes,
  } satisfies HttpCacheEntry<T>)

  if (Date.now() - lastEviction > EVICTION_INTERVAL_MS) {
    lastEviction = Date.now()
    void evictOldEntries()
  }
}

async function evictOldEntries(): Promise<void> {
  const entries = await idbGetAll<HttpCacheEntry>(HTTP_CACHE_STORE)
  if (entries.length <= MAX_ENTRIES) return

  const oldest = entries
    .sort((a, b) => a.storedAt - b.storedAt)
    .slice(0, entries.length - MAX_ENTRIES)

  await Promise.all(
    oldest.map((entry) => idbDelete(HTTP_CACHE_STORE, entry.key)),
  )
}

export async function clearHttpCache(): Promise<void> {
  await idbClear(HTTP_CACHE_STORE)
}
