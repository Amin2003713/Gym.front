import { GymApiNotConfiguredError } from './contracts'

export type ApiResourceState<T> =
  | { status: 'loading' }
  | { status: 'disconnected'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string; traceId?: string }

export function toApiResourceState<T>(args: {
  data?: T | null
  isLoading?: boolean
  error?: unknown
  isEmpty?: (data: T) => boolean
}): ApiResourceState<T> {
  if (args.isLoading) return { status: 'loading' }
  if (args.error instanceof GymApiNotConfiguredError) {
    return { status: 'disconnected', message: args.error.message }
  }
  if (args.error) {
    const error = args.error as { message?: string; traceId?: string }
    return { status: 'error', message: error.message ?? 'دریافت اطلاعات ناموفق بود.', traceId: error.traceId }
  }
  if (args.data == null) return { status: 'disconnected', message: 'سرویس هنوز پیکربندی نشده است.' }
  if (args.isEmpty?.(args.data)) return { status: 'empty' }
  return { status: 'ready', data: args.data }
}
