import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { getSession } from 'next-auth/react'

import { auth } from '@/auth'
import { API_URL } from '@/configs/global'
import { ApiError } from '@/types/http-errors.interface'

import { errorHandler, networkErrorStrategy } from './http-error-strategies'

const getBaseURL = async (): Promise<string> => {
  let host: string

  if (typeof window !== 'undefined') {
    host = window.location.host
  } else {
    // Server-side: Dynamically import 'next/headers' to avoid client-side import errors.
    const { headers } = await import('next/headers')
    const serverHeaders = await headers()
    host = serverHeaders.get('host') || API_URL!
  }

  const hostParts = host.split('.')
  const potentialSubdomain = hostParts[0]

  const hasValidSubdomain = hostParts.length > 2

  const domain = hasValidSubdomain
    ? `${potentialSubdomain}.${API_URL}`
    : API_URL

  return `https://${domain}`
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
      if (statusCode >= 400) {
        const errorData: ApiError = error.response.data
        errorHandler[statusCode](errorData)
      }
    } else {
      networkErrorStrategy()
    }
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
