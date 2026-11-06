import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type PageSkeletonProps = {
  /** Number of placeholder cards. */
  rows?: number
  /** Hide the title block when the page has no heading of its own. */
  withHeader?: boolean
  className?: string
}

/**
 * Route-level skeleton. Rendered by `loading.tsx`, so it appears the instant a link is clicked and
 * stays until the server payload arrives — no white flash, no layout jump when data lands.
 */
export function PageSkeleton({ rows = 3, withHeader = true, className }: PageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn('w-full space-y-4', className)}
    >
      <span className="sr-only">در حال بارگذاری…</span>

      {withHeader && (
        <div className="space-y-2">
          <Skeleton className="h-7 w-44 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="bg-card rounded-lg border p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-4 h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
