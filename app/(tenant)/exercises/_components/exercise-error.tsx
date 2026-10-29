'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

interface ExerciseErrorProps {
  message: string
  onRetry: () => void
}

export default function ExerciseError({
  message,
  onRetry,
}: ExerciseErrorProps) {
  return (
    <div
      role="alert"
      className="border-destructive/30 flex flex-col items-center gap-3 rounded-lg border p-6 text-center"
    >
      <AlertCircle className="text-destructive size-8" />

      <p className="text-sm">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm"
      >
        <RefreshCw className="size-4" />
        تلاش مجدد
      </button>
    </div>
  )
}
