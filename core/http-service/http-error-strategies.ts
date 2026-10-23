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

const badRequestErrorStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData } as BadRequestError
}

const validationErrorStrategy: ApiErrorHandler = (errorData) => {
  throw { ...errorData } as ValidationError
}

const notFoundErrorStrategy: ApiErrorHandler = (errorData) => {
  throw {
    ...errorData,
    detail: 'سرویس مورد نظر یافت نشد',
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
    detail: 'خطای سرور',
  } as UnhandledException
}

export const networkErrorStrategy = (): ApiError => {
  throw { detail: 'خطای شبکه' } as NetworkError
}

export const errorHandler: Record<number, ApiErrorHandler> = {
  400: (errorData) =>
    errorData.errors ? validationErrorStrategy(errorData) : badRequestErrorStrategy(errorData),
  401: (errorData) => unauthorizedErrorStrategy(errorData),
  404: (errorData) => notFoundErrorStrategy(errorData),
  403: (errorData) => unauthorizedErrorStrategy(errorData),
  500: (errorData) => unhandledExceptionStrategy(errorData),
}
