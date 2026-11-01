import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

import { PlanBuilder } from '../../_components/plan-builder'

export const metadata = { title: 'ویرایش برنامه تمرینی' }

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <PlanBuilder planId={id} />
    </Protected>
  )
}
