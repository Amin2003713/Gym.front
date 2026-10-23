import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { getSession } from 'next-auth/react'

import { auth } from '@/auth'
import { API_URL } from '@/configs/global'
import { ApiError } from '@/types/http-errors.interface'

import { errorHandler, networkErrorStrategy } from './http-error-strategies'

const getBaseURL = async (): Promise<string> => {
  const configuredUrl = API_URL?.trim()

  if (!configuredUrl) {
    throw new Error('NEXT_PUBLIC_API_URL must be configured before making API requests.')
  }

  // Development currently uses plain HTTP. Normalize URLs regardless of whether
  // the environment value includes a protocol, and never accidentally prepend
  // a second scheme or duplicate a tenant subdomain.
  const normalizedUrl = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `http://${configuredUrl}`
  const baseUrl = new URL(normalizedUrl)
  baseUrl.protocol = 'http:'
  return baseUrl.origin
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
