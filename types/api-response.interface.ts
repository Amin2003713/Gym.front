import { Problem } from '@/types/http-errors.interface'

export type ApiResponse<T> = {
  data: T | null
  error: Problem | null
}
