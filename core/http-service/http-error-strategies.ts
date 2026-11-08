import {
  ApiError,
  BadRequestError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  UnhandledException,
  ValidationError,
} from '@/types/http-errors.interface'

type ApiErrorHandler = (errorData: ApiError) => void

const normalizeApiError = (
  errorData: Partial<ApiError> | undefined,
  fallback: { status: number; title: string; detail: string },
): ApiError =>
  ({
    title: errorData?.title ?? fallback.title,
    status: errorData?.status ?? fallback.status,
    detail: errorData?.detail ?? fallback.detail,
    errors: errorData?.errors,
  }) as ApiError

const badRequestErrorStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData } as BadRequestError
}

const validationErrorStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData } as ValidationError
}

const notFoundErrorStrategy: ApiErrorHandler = (errorData) => {
  throw {
    ...errorData,
    detail: 'Service not found.',
  } as NotFoundError
}

const unauthorizedErrorStrategy: ApiErrorHandler = (errorData) => {
  throw {
    ...errorData,
  } as UnauthorizedError
}

const unhandledExceptionStrategy: ApiErrorHandler = (errorData) => {
  throw {
    ...errorData,
    detail: 'server error.',
  } as UnhandledException
}

export const networkErrorStrategy = (): ApiError => {
  throw { detail: 'Network error.' } as NetworkError
}

export const errorHandler: Record<number, ApiErrorHandler> = {
  400: (errorData) =>
    errorData.errors
      ? validationErrorStrategy(errorData)
      : badRequestErrorStrategy(errorData),
  422: (errorData) => validationErrorStrategy(errorData),
  401: (errorData) => unauthorizedErrorStrategy(errorData),
  404: (errorData) => notFoundErrorStrategy(errorData),
  403: (errorData) => unauthorizedErrorStrategy(errorData),
  500: (errorData) => unhandledExceptionStrategy(errorData),
}

export const handleApiErrorByStatus = (
  statusCode: number,
  errorData?: Partial<ApiError>,
): never => {
  const normalizedError = normalizeApiError(errorData, {
    status: statusCode || 500,
    title: 'Request failed',
    detail: `Request failed with status ${statusCode || 500}.`,
  })

  const strategy = errorHandler[statusCode]
  if (typeof strategy === 'function') {
    strategy(normalizedError)
  }
  unhandledExceptionStrategy(normalizedError)
  throw normalizedError
}
