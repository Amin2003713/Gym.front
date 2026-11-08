import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { getSession } from 'next-auth/react'

import { auth } from '@/auth'
import { API_URL } from '@/configs/global'
import { ApiError } from '@/types/http-errors.interface'

import { errorHandler, networkErrorStrategy } from './http-error-strategies'

const normalizeHost = (value: string): string =>
  value
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\\d+$/, '')

const getTenantFromClientHost = (clientHost: string): string | null => {
  const host = normalizeHost(clientHost)
  // Prefer the configured client base domain so only its direct tenant
  // subdomains can affect the API host.
  const configuredClientBase = process.env.NEXT_PUBLIC_BASE_DOMAIN
  const clientBase = configuredClientBase
    ? normalizeHost(configuredClientBase)
    : ''

  if (clientBase && host.endsWith(`.${clientBase}`)) {
    const prefix = host.slice(0, -(clientBase.length + 1))
    if (prefix && !prefix.includes('.') && prefix !== 'www' && prefix !== 'api')
      return prefix
    return null
  }

  // Local/dev and deployments without NEXT_PUBLIC_BASE_DOMAIN.
  if (!clientBase && host !== 'localhost' && host !== '127.0.0.1') {
    const parts = host.split('.')
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api')
      return parts[0]
  }
  return null
}

type BaseUrl = { baseURL: string; tenant: string | null }

// The host cannot change inside one page, so resolving it once per host removes a headers()
// lookup and URL parsing from every request. Only the host is cached, never the token.
const baseUrlCache = new Map<string, BaseUrl>()

/**
 * Resolves the API origin for the current host, including the tenant subdomain in production.
 * Exported so other transports that must hit the same backend (the SignalR live hub) do not
 * reinvent the tenant rules and accidentally talk to the bare base domain.
 */
export const getBaseURL = async (): Promise<BaseUrl> => {
  const configuredApiUrl = API_URL?.trim()

  if (!configuredApiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.')
  }

  let clientHost = ''

  if (typeof window !== 'undefined') {
    clientHost = window.location.hostname
  } else {
    const { headers } = await import('next/headers')
    const requestHeaders = await headers()

    clientHost =
      requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || ''
  }

  const cached = baseUrlCache.get(clientHost)
  if (cached) return cached

  const apiUrl = new URL(
    /^[a-z][a-z0-9+.-]*:\/\//i.test(configuredApiUrl)
      ? configuredApiUrl
      : `https://${configuredApiUrl}`,
  )

  const tenant = getTenantFromClientHost(clientHost)

  if (tenant) {
    if (process.env.NODE_ENV === 'development') {
      // Avoid Node.js for tenant.localhost.
      apiUrl.hostname = 'localhost'
    } else {
      // Keep tenant subdomains in production if your API requires them.
      apiUrl.hostname = `${tenant}.${apiUrl.hostname}`
    }
  }

  const resolved: BaseUrl = {
    baseURL: apiUrl.toString().replace(/\/$/, ''),
    tenant,
  }

  baseUrlCache.set(clientHost, resolved)
  return resolved
}

const httpService = axios.create({
  // A dead link should fail the request instead of hanging the screen forever.
  timeout: 25_000,
  headers: {
    'X-Device-Type': 'Browser',
    'X-Accept-Language': 'fa-IR',
  },
})

type ClientSession = Awaited<ReturnType<typeof getSession>>

/**
 * The session (user + token) does not change after login: the backend rejects a host/tenant change
 * with 401 instead of silently serving another gym. So the client is allowed to keep it in memory
 * for five minutes and only re-reads it after a 401 (`resyncSession`).
 */
const SESSION_TTL_MS = 5 * 60 * 1000
const RESYNC_GUARD_MS = 15 * 1000

let clientSession: Promise<ClientSession> | null = null
let clientSessionAt = 0
let lastSessionResetAt = 0

const resetClientSession = () => {
  clientSession = null
  clientSessionAt = 0
}

/**
 * `getSession()` reads /api/auth/session over the network. Calling it before every API request
 * doubled the traffic on mobile; the in-memory copy collapses a screen's burst of calls into one
 * read. Server renders keep using `auth()` per request — never shared between users.
 */
const readSession = (): Promise<ClientSession> => {
  if (typeof window === 'undefined') return auth()

  const now = Date.now()

  if (!clientSession || now - clientSessionAt > SESSION_TTL_MS) {
    clientSessionAt = now
    clientSession = getSession().catch((error) => {
      resetClientSession()
      throw error
    })
  }

  return clientSession
}

/** After a 401 the cached copy is worthless: read the session once more, then retry the request. */
const resyncSession = async (): Promise<string | null> => {
  resetClientSession()

  try {
    const session = await readSession()
    return session?.user?.accessToken ?? null
  } catch {
    return null
  }
}

let redirectingToSignin = false

const handleExpiredSession = async () => {
  if (typeof window === 'undefined' || redirectingToSignin) return

  const now = Date.now()
  if (now - lastSessionResetAt < RESYNC_GUARD_MS) return

  lastSessionResetAt = now
  redirectingToSignin = true

  try {
    const { signOut } = await import('next-auth/react')
    await signOut({ redirect: false })
  } catch {
    // Sign-out is best effort; the redirect below still clears the broken state.
  }

  if (!window.location.pathname.startsWith('/signin')) {
    window.location.replace('/signin')
  }
}

httpService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const statusCode = error?.response?.status as number | undefined
    const config = error?.config as
      | (AxiosRequestConfig & { __sessionResynced?: boolean })
      | undefined

    if (statusCode === 401) {
      // The token was rejected (expired, or the tenant no longer matches this host). Re-read the
      // session once and replay the request; only a second failure signs the user out.
      if (config && !config.__sessionResynced) {
        config.__sessionResynced = true

        const token = await resyncSession()

        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          }

          return httpService(config)
        }
      }

      await handleExpiredSession()
    }

    if (error?.response) {
      const errorData: ApiError = error.response.data
      errorHandler[statusCode as number]?.(errorData)
    } else {
      networkErrorStrategy()
    }

    return Promise.reject(error)
  },
)

const apiBase = async <T>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const session = await readSession()

  const baseURL = await getBaseURL()
  const fullURL = `${baseURL.baseURL}/api/${url}`

  const headers = {
    ...options?.headers,
    ...(baseURL.tenant && {
      'X-Tenant': baseURL.tenant,
    }),
    ...(session?.user?.accessToken && {
      Authorization: `Bearer ${session.user.accessToken}`,
    }),
  }

  const response = await httpService(fullURL, {
    ...options,
    headers,
  })

  return response.data as T
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
