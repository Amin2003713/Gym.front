import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'
import { SupportCenter } from '@/app/(tenant)/_components/support/support-center'

export default function SupportDeskPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <SupportCenter staff />
    </Protected>
  )
}
