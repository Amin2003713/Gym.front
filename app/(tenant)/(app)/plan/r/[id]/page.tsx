import { PlanRun } from './_components/plan-run'

export const metadata = { title: 'اجرای برنامه' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <PlanRun assignmentId={id} />
}
