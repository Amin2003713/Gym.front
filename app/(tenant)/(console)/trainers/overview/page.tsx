import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

import { CoachMemberReport } from './_components/coach-member-report'

export const metadata = { title: 'گزارش مربی' }

export default function CoachOverviewPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <CoachMemberReport />
    </Protected>
  )
}
