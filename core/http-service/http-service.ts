import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { getSession, signOut } from 'next-auth/react'

import { auth } from '@/auth'
import { API_URL, BASE_DOMAIN } from '@/configs/global'
import { logRequestError, logResponse } from '@/core/http-service/http-logger'
import { ApiError } from '@/types/http-errors.interface'
import { extractSubdomain, isValidSubdomain } from '@/utils/subdomain'

import {
  handleApiErrorByStatus,
  networkErrorStrategy,
} from './http-error-strategies'

const isClient = typeof window !== 'undefined'
let isRedirectingToSignin = false

const getAccessToken = async (): Promise<string | undefined> => {
  const session = await (isClient ? getSession() : auth())
  return session?.user.accessToken
}

const parseApiUrl = (raw: string): { host: string; basePath: string } => {
  if (!raw) return { host: '', basePath: '' }

  const candidate =
    raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`

  try {
    const u = new URL(candidate)
    return {
      host: u.host, // "abadisdev.com"
      basePath: u.pathname.replace(/\/$/, ''), // "" or "/lite"
    }
  } catch {
    // fallback for weird strings
    const [host, ...rest] = raw.split('/')
    const basePath = rest.length ? `/${rest.join('/')}` : ''
    return { host, basePath: basePath.replace(/\/$/, '') }
  }
}

const getBaseURL = async (): Promise<string> => {
  let host: string

  if (typeof window !== 'undefined') {
    host = window.location.host
  } else {
    const { headers } = await import('next/headers')
    const serverHeaders = await headers()
    host = serverHeaders.get('host') || BASE_DOMAIN
  }

  const subdomain = extractSubdomain(host)
  const hasValidSubdomain = !!subdomain && isValidSubdomain(subdomain)

  const { host: apiHost, basePath } = parseApiUrl(API_URL ?? '')

  // If API_URL includes a path (/lite), keep it AFTER the host.
  const domain = hasValidSubdomain ? `${subdomain}.${apiHost}` : apiHost

  // Keep https because your backend is https
  return `https://${domain}${basePath}`
}

const httpService = axios.create({
  headers: {
    'X-Device-Type': 'Browser',
    'X-Accept-Language': 'fa-IR',
  },
})

const redirectToSigninOnUnauthorized = () => {
  if (!isClient || isRedirectingToSignin) return
  if (window.location.pathname.startsWith('/signin')) return

  isRedirectingToSignin = true
  const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
  void signOut({ redirect: false })
    .catch(() => undefined)
    .finally(() => {
      window.location.replace(
        `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      )
    })
}

httpService.interceptors.response.use(
  (response) => {
    logResponse(response)
    return response
  },
  (error) => {
    logRequestError(error)

    if (error?.response) {
      const statusCode = Number(error.response.status)

      if (statusCode >= 400) {
        if (statusCode === 401) {
          redirectToSigninOnUnauthorized()
        }

        const errorData: ApiError = error.response.data

        handleApiErrorByStatus(statusCode, errorData)
      }
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
  if (isClient && isRedirectingToSignin) {
    return Promise.reject({
      status: 401,
      title: 'Unauthorized',
      detail: 'Redirecting to signin.',
    } as ApiError)
  }

  const accessToken = await getAccessToken()

  const headers = {
    ...options?.headers,
    ...(accessToken && {
      Authorization: `Bearer ${accessToken}`,
    }),
  }

  const baseURL = await getBaseURL()
  const fullURL = `${baseURL}/api/${url}`

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

export { createData, readData, updateData, deleteData }
