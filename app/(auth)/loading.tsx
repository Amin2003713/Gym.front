import { Skeleton } from '@/components/ui/skeleton'

export default function AuthLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-svh items-center justify-center px-4 py-8"
    >
      <span className="sr-only">در حال بارگذاری…</span>
      <div className="bg-card w-full max-w-md space-y-4 rounded-lg border p-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
