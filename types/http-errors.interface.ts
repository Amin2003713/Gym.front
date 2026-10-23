interface Problem {
    title: string;
    status: number;
    detail?: string;
    errors?: Record<string, string[]>
}

interface BadRequestError extends Problem {}
interface UnauthorizedError extends Problem {}
interface ValidationError extends Problem {}
interface NotFoundError extends Problem {}
interface NetworkError extends Problem {}
interface UnhandledException extends Problem {}

type ApiError =
    BadRequestError
    | UnauthorizedError
    | ValidationError
    | NotFoundError
    | NetworkError
    | UnhandledException

export type {
    Problem,
    BadRequestError,
    UnauthorizedError,
    ValidationError,
    NotFoundError,
    NetworkError,
    UnhandledException,
    ApiError
}
