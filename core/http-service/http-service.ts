import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { getSession } from 'next-auth/react'
import { toast } from 'sonner'

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
  (error: unknown) => {
    let normalizedError: unknown = error
    let description = 'در ارتباط با سرور خطایی رخ داد.'

    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as
        | { detail?: string; title?: string; message?: string; errors?: Record<string, string[] | string> }
        | string
        | undefined

      if (responseData && typeof responseData === 'object') {
        description = responseData.detail || responseData.title || responseData.message || description
        if (!responseData.detail && !responseData.title && !responseData.message && responseData.errors) {
          const firstError = Object.values(responseData.errors)[0]
          description = Array.isArray(firstError) ? firstError[0] || description : firstError || description
        }
      } else if (error.code === 'ERR_NETWORK') {
        description = 'خطا در اتصال به سرور؛ اتصال شبکه و آدرس API را بررسی کنید.'
      } else if (error.response?.status === 404) {
        description = 'سرویس مورد نظر یافت نشد.'
      }

      const statusCode = error.response?.status
      if (statusCode && error.response?.data && typeof responseData === 'object') {
        try {
          errorHandler[statusCode]?.(responseData as ApiError)
        } catch (handledError) {
          normalizedError = handledError
          const handled = handledError as { detail?: string; title?: string }
          description = handled.detail || handled.title || description
        }
      } else if (!error.response) {
        try {
          networkErrorStrategy()
        } catch (handledError) {
          normalizedError = handledError
          const handled = handledError as { detail?: string }
          description = handled.detail || description
        }
      }
    }

    // Browser API failures are surfaced consistently. Server actions return their
    // errors to the calling form, which displays them through its own toast.
    if (typeof window !== 'undefined') {
      toast.error('خطا در درخواست', {
        description,
        duration: 5000,
        position: 'top-right',
      })
    }

    return Promise.reject(normalizedError)
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
