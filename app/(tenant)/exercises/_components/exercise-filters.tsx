'use client'

import { Search, X } from 'lucide-react'

interface ExerciseFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  onReset: () => void
}

export default function ExerciseFilters({
  search,
  onSearchChange,
  onReset,
}: ExerciseFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />

        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="جستجوی حرکت..."
          aria-label="جستجوی حرکات"
          className="bg-background focus:ring-primary h-11 w-full rounded-lg border pr-10 pl-3 text-sm outline-none focus:ring-2"
        />
      </div>

      {search && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm"
        >
          <X className="size-4" />
          پاک کردن
        </button>
      )}
    </div>
  )
}
