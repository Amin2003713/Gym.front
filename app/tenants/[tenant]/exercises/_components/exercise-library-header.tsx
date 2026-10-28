'use client'

import { Plus, RefreshCw } from 'lucide-react'

interface ExerciseLibraryHeaderProps {
  onCreate?: () => void
  onRefresh: () => void
  loading?: boolean
}

export default function ExerciseLibraryHeader({
  onCreate,
  onRefresh,
  loading = false,
}: ExerciseLibraryHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">کتابخانه حرکات</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          مدیریت و مشاهده حرکات ورزشی
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </button>

        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="bg-primary text-primary-foreground inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
          >
            <Plus className="size-4" />
            حرکت جدید
          </button>
        )}
      </div>
    </div>
  )
}
