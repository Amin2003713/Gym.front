import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

import { PlanBuilder } from '../_components/plan-builder'

export const metadata = { title: 'برنامه تمرینی جدید' }

export default function NewPlanPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <PlanBuilder />
    </Protected>
  )
}
