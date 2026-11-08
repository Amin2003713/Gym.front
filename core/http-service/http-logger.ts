import type { AxiosRequestConfig, AxiosResponse } from 'axios'

const SENSITIVE_KEYS = [
  'authorization',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
]

const maskSensitiveData = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData)
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      SENSITIVE_KEYS.some(
        (sensitive) => sensitive.toLowerCase() === key.toLowerCase(),
      )
        ? '***REDACTED***'
        : maskSensitiveData(value),
    ]),
  )
}

const getTimestamp = () => new Date().toISOString()

export const logRequest = (config: AxiosRequestConfig) => {
  const requestId = crypto.randomUUID()

  config.headers = config.headers ?? {}
  config.headers['X-Request-ID'] = requestId

  console.groupCollapsed(
    `%c[HTTP REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
    'color: #2196f3; font-weight: bold',
  )

  console.log('Request ID:', requestId)
  console.log('Timestamp:', getTimestamp())
  console.log('Method:', config.method?.toUpperCase())
  console.log('URL:', config.url)
  console.log('Base URL:', config.baseURL)
  console.log('Headers:', maskSensitiveData(config.headers))
  console.log('Query Params:', maskSensitiveData(config.params))
  console.log('Request Body:', maskSensitiveData(config.data))

  console.groupEnd()
  ;(config as any).__requestStartedAt = Date.now()

  return config
}

export const logResponse = (response: AxiosResponse) => {
  const startedAt = (response.config as any).__requestStartedAt
  const duration = startedAt ? Date.now() - startedAt : undefined

  console.groupCollapsed(
    `%c[HTTP RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
    'color: #4caf50; font-weight: bold',
  )

  console.log('Request ID:', response.config.headers?.['X-Request-ID'])
  console.log('Timestamp:', getTimestamp())
  console.log('Status:', response.status)
  console.log('Duration:', `${duration ?? 'N/A'} ms`)
  console.log('Response Headers:', response.headers)
  console.log('Response Data:', maskSensitiveData(response.data))

  console.groupEnd()

  return response
}

export const logRequestError = (error: any) => {
  const config = error?.config
  const startedAt = config?.__requestStartedAt
  const duration = startedAt ? Date.now() - startedAt : undefined

  console.groupCollapsed(
    `%c[HTTP ERROR] ${config?.method?.toUpperCase() ?? 'UNKNOWN'} ${config?.url ?? 'UNKNOWN'}`,
    'color: #f44336; font-weight: bold',
  )

  console.error('Request ID:', config?.headers?.['X-Request-ID'])
  console.error('Timestamp:', getTimestamp())
  console.error('Status:', error?.response?.status ?? 'NETWORK ERROR')
  console.error('Duration:', `${duration ?? 'N/A'} ms`)
  console.error('Message:', error?.message)
  console.error('Response Data:', maskSensitiveData(error?.response?.data))

  console.groupEnd()
}
