import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { getSession } from 'next-auth/react'

import { auth } from '@/auth'
import { API_URL } from '@/configs/global'
import { buildHttpCacheKey, readHttpCache, writeHttpCache } from '@/lib/offline/http-cache'
import {
  enqueueMutation,
  isQueueableMutation,
  type QueuedMutation,
  queuedMutationResult,
} from '@/lib/offline/mutation-queue'
import { ApiError } from '@/types/http-errors.interface'

import { errorHandler, networkErrorStrategy } from './http-error-strategies'

const normalizeHost = (value: string): string =>
  value
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '')

const getTenantFromClientHost = (clientHost: string): string | null => {
  const host = normalizeHost(clientHost)
  // Prefer the configured client base domain so only its direct tenant
  // subdomains can affect the API host.
  const configuredClientBase = process.env.NEXT_PUBLIC_BASE_DOMAIN
  const clientBase = configuredClientBase ? normalizeHost(configuredClientBase) : ''

  if (clientBase && host.endsWith(`.${clientBase}`)) {
    const prefix = host.slice(0, -(clientBase.length + 1))
    if (prefix && !prefix.includes('.') && prefix !== 'www' && prefix !== 'api') return prefix
    return null
  }

  // Local/dev and deployments without NEXT_PUBLIC_BASE_DOMAIN.
  if (!clientBase && host !== 'localhost' && host !== '127.0.0.1') {
    const parts = host.split('.')
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') return parts[0]
  }
  return null
}


const getBaseURL = async (): Promise<{ baseURL: string; tenant: string | null }> => {
  const configuredApiUrl = API_URL?.trim()

  if (!configuredApiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.')
  }

  const apiUrl = new URL(
    /^[a-z][a-z0-9+.-]*:\/\//i.test(configuredApiUrl)
      ? configuredApiUrl
      : `https://${configuredApiUrl}`,
  )

  let clientHost = ''

  if (typeof window !== 'undefined') {
    clientHost = window.location.hostname
  } else {
    const { headers } = await import('next/headers')
    const requestHeaders = await headers()

    clientHost =
      requestHeaders.get('x-forwarded-host') ||
      requestHeaders.get('host') ||
      ''
  }

  const tenant = getTenantFromClientHost(clientHost)

  if (tenant) {
    if (process.env.NODE_ENV === 'development') {
      // Avoid Node.js ENOTFOUND for tenant.localhost.
      apiUrl.hostname = 'localhost'
    } else {
      // Keep tenant subdomains in production if your API requires them.
      apiUrl.hostname = `${tenant}.${apiUrl.hostname}`
    }
  }

  return {
    baseURL: apiUrl.toString().replace(/\/$/, ''),
    tenant,
  }
}


const httpService = axios.create({
  // A dead 3G link should fail over to the cache instead of hanging the screen forever.
  timeout: 25_000,
  headers: {
    'X-Device-Type': 'Browser',
    'X-Accept-Language': 'fa-IR',
  },
})

type ClientSession = Awaited<ReturnType<typeof getSession>>

let clientSession: Promise<ClientSession> | null = null
let clientSessionAt = 0
const CLIENT_SESSION_TTL_MS = 15_000

const resetClientSession = () => {
  clientSession = null
  clientSessionAt = 0
}

/**
 * `getSession()` reads /api/auth/session over the network. Calling it before every API request
 * doubled the traffic on mobile; a 15s memo collapses a screen's burst of calls into one read.
 * Server renders keep using `auth()` per request — never shared between users.
 */
const readSession = () => {
  if (typeof window === 'undefined') return auth()

  const now = Date.now()

  if (!clientSession || now - clientSessionAt > CLIENT_SESSION_TTL_MS) {
    clientSessionAt = now
    clientSession = getSession().catch((error) => {
      resetClientSession()
      throw error
    })
  }

  return clientSession
}

httpService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response) {
      const statusCode = error.response.status
      const errorData: ApiError = error.response.data

      // The cached token no longer works (sign-out, expiry): force a fresh session next call.
      if (statusCode === 401) resetClientSession()

      errorHandler[statusCode]?.(errorData)
    } else {
      const method = String(error?.config?.method ?? 'GET').toUpperCase()
      const requestUrl = String(error?.config?.url ?? '')

      // GETs can be served from the offline cache and workout writes can be queued;
      // warning the user about the network before those fallbacks run is misleading.
      if (!(method === 'GET' || isQueueableMutation(requestUrl, method))) {
        networkErrorStrategy()
      }
    }

    return Promise.reject(error)
  },
)

const CACHE_EXCLUDED = /^(auth|user\/passkeys|notifications|coach\/chat|live)/

const cacheableGet = (url: string, method: string): boolean =>
  method === 'GET' && !CACHE_EXCLUDED.test(url)

const isNetworkFailure = (error: unknown): boolean =>
  axios.isAxiosError(error) && !error.response

const userCacheKey = (session: ClientSession): string => {
  const user = session?.user as
    | { email?: string | null; id?: string | null; sub?: string | null }
    | undefined
  return user?.email ?? user?.id ?? user?.sub ?? 'anonymous'
}

const queuedHeaders = (
  headers: Record<string, unknown> | undefined,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers ?? {})
      .filter(([key, value]) => {
        if (['authorization', 'x-tenant'].includes(key.toLowerCase())) return false
        return value !== undefined && value !== null && value !== ''
      })
      .map(([key, value]) => [key, String(value)]),
  )

const apiBase = async <T>(
  url: string,
  options?: AxiosRequestConfig,
  internal?: { skipQueue?: boolean },
): Promise<T> => {
  const session = await readSession()

  const baseURL = await getBaseURL()
  const fullURL = `${baseURL.baseURL}/api/${url}`
  const method = String(options?.method ?? 'GET').toUpperCase()
  const cacheKey = cacheableGet(url, method)
    ? buildHttpCacheKey({
        baseURL: baseURL.baseURL,
        url,
        tenant: baseURL.tenant,
        userKey: userCacheKey(session),
        params: options?.params,
      })
    : ''

  const headers = {
    ...options?.headers,
    ...(baseURL.tenant && {
      'X-Tenant': baseURL.tenant,
    }),
    ...(session?.user?.accessToken && {
      Authorization: `Bearer ${session.user.accessToken}`,
    }),
  }

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false

  // Offline-first read: an already-cached screen opens immediately, even on a dead link.
  if (cacheKey && offline) {
    const cached = await readHttpCache<T>(cacheKey)
    if (cached) return cached.data
  }

  // Queue workout writes before spending time on a request that cannot leave the device.
  if (
    !internal?.skipQueue &&
    offline &&
    isQueueableMutation(url, method)
  ) {
    await enqueueMutation({
      url,
      method,
      data: options?.data,
      headers: queuedHeaders(
        options?.headers as Record<string, unknown> | undefined,
      ),
    })
    return queuedMutationResult(url, method) as T
  }

  try {
    const response = await httpService(fullURL, {
      ...options,
      headers,
    })

    if (cacheKey) void writeHttpCache(cacheKey, response.data)

    return response.data as T
  } catch (error) {
    // A flaky link should degrade to the last good payload instead of an empty screen.
    if (cacheKey) {
      const cached = await readHttpCache<T>(cacheKey)
      if (cached) return cached.data
    }

    if (
      !internal?.skipQueue &&
      isNetworkFailure(error) &&
      isQueueableMutation(url, method)
    ) {
      await enqueueMutation({
        url,
        method,
        data: options?.data,
        headers: queuedHeaders(
          options?.headers as Record<string, unknown> | undefined,
        ),
      })
      return queuedMutationResult(url, method) as T
    }

    throw error
  }
}

/** Used by the sync worker; failures are surfaced to the queue instead of being re-queued. */
export const flushQueuedMutation = async (
  item: QueuedMutation,
): Promise<void> => {
  await apiBase(
    item.url,
    {
      method: item.method,
      data: item.data,
      headers: item.headers,
    },
    { skipQueue: true },
  )
}

const readData = async <T>(
  url: string,
  otherConfigs?: Omit<AxiosRequestConfig, 'method'>,
): Promise<T> => {
  const options: AxiosRequestConfig = {
    method: 'GET',
    ...otherConfigs,
  }
  return await apiBase(url, options)
}

const createData = async <TModel, TResult>(
  url: string,
  data: TModel,
  headers?: AxiosRequestHeaders,
): Promise<TResult> => {
  const options: AxiosRequestConfig = {
    method: 'POST',
    headers,
    data,
  }
  return await apiBase(url, options)
}

const updateData = async <TModel, TResult>(
  url: string,
  data: TModel,
  headers?:
    | AxiosRequestHeaders
    | {
    'X-Tenant': string
  },
): Promise<TResult> => {
  const options: AxiosRequestConfig = {
    method: 'PUT',
    headers,
    data,
  }
  return await apiBase(url, options)
}

const deleteData = async <TModel>(
  url: string,
  headers?: AxiosRequestHeaders,
  data?: TModel,
): Promise<void> => {
  const options: AxiosRequestConfig = {
    method: 'DELETE',
    data,
    headers,
  }
  return await apiBase(url, options)
}

const readBlob = async (
  url: string,
  otherConfigs?: Omit<AxiosRequestConfig, 'method' | 'responseType'>,
): Promise<Blob> => {
  const session = await readSession()
  const baseURL = await getBaseURL()
  const fullURL = `${baseURL.baseURL}/api/${url}`

  const response = await httpService(fullURL, {
    method: 'GET',
    responseType: 'blob',
    ...otherConfigs,
    headers: {
      ...otherConfigs?.headers,
      ...(baseURL.tenant && { 'X-Tenant': baseURL.tenant }),
      ...(session?.user?.accessToken && {
        Authorization: `Bearer ${session.user.accessToken}`,
      }),
    },
  })

  return response.data as Blob
}

export { createData, readData, updateData, deleteData, readBlob }
