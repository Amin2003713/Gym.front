'use client'

interface ExercisePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function ExercisePagination({
  page,
  totalPages,
  onPageChange,
}: ExercisePaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="صفحه‌بندی حرکات"
      className="flex items-center justify-center gap-3"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-9 rounded-lg border px-3 text-sm disabled:opacity-40"
      >
        قبلی
      </button>

      <span className="text-muted-foreground text-sm">
        صفحه {page} از {totalPages}
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="h-9 rounded-lg border px-3 text-sm disabled:opacity-40"
      >
        بعدی
      </button>
    </nav>
  )
}
