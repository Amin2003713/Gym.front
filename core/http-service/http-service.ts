import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { getSession } from 'next-auth/react'

import { auth } from '@/auth'
import { API_URL } from '@/configs/global'
import { ApiError } from '@/types/http-errors.interface'

import { errorHandler, networkErrorStrategy } from './http-error-strategies'
import { cwd } from 'process'

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
      : `http://${configuredApiUrl}`,
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
  headers: {
    'X-Device-Type': 'Browser',
    'X-Accept-Language': 'fa-IR',
  },
})

httpService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response) {
      const statusCode = error.response.status
      const errorData: ApiError = error.response.data

      errorHandler[statusCode]?.(errorData)
    } else {
      console.error('HTTP network error:', {
        message: error?.message,
        code: error?.code,
        url: error?.config?.url,
        method: error?.config?.method,
      })

      networkErrorStrategy()
    }

    return Promise.reject(error)
  },
)

const apiBase = async <T>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const session = await (typeof window !== 'undefined' ? getSession() : auth())

  const headers = {
    ...options?.headers,
    ...(session?.user?.accessToken && {
      Authorization: `Bearer ${session.user.accessToken}`,
    }),
  }

  const baseURL = await getBaseURL()
  const fullURL = `${baseURL}/api/${url}` // Construct full URL to handle both client and server.


  const response = await httpService(fullURL, {
    ...options,
    headers,
  })

  console.log(response)


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
