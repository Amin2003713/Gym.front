import axios from 'axios'
import type { Problem } from '@/types/http-errors.interface'

function isProblem(value: unknown): value is Problem {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('detail' in value || 'title' in value || 'status' in value)
  )
}

export function normalizeProblem(error: unknown, fallback = 'خطای نامشخص رخ داد'): Problem {
  if (isProblem(error)) return error

  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (isProblem(data)) return data
    return {
      status: error.response?.status,
      detail: (data as any)?.detail ?? error.message ?? fallback,
    } as Problem
  }

  if (error instanceof Error) {
    return { detail: error.message || fallback } as Problem
  }

  return { detail: fallback } as Problem
}