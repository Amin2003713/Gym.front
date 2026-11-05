'use client'

import { LayoutGrid, List, Minimize2, Plus, RefreshCw } from '@/components/icons'

export type ExerciseViewMode = 'card' | 'list' | 'compact'

const VIEW_OPTIONS: { value: ExerciseViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'card', label: 'کارت', icon: LayoutGrid },
  { value: 'list', label: 'فهرست', icon: List },
  { value: 'compact', label: 'فشرده', icon: Minimize2 },
]

interface ExerciseLibraryHeaderProps {
  onCreate?: () => void
  onRefresh: () => void
  loading?: boolean
  view: ExerciseViewMode
  onViewChange: (view: ExerciseViewMode) => void
}

export default function ExerciseLibraryHeader({
  onCreate,
  onRefresh,
  loading = false,
  view,
  onViewChange,
}: ExerciseLibraryHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">کتابخانه حرکات</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          مدیریت و مشاهده حرکات ورزشی
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="قالب نمایش فهرست حرکات"
          className="bg-muted/40 flex items-center gap-1 rounded-lg border p-1"
        >
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = view === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                title={option.label}
                onClick={() => onViewChange(option.value)}
                className={`focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </button>

        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="focus-visible:ring-ring bg-primary text-primary-foreground inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
          >
            <Plus className="size-4" />
            حرکت جدید
          </button>
        )}
      </div>
    </div>
  )
}
