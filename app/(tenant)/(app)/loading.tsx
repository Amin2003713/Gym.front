import { PageSkeleton } from '@/components/skeleton/page-skeleton'

export default function MemberAppLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageSkeleton rows={4} />
    </div>
  )
}
