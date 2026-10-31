import { GymFeaturePage } from '@/features/gym/components/gym-feature-page'
import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

export default function Page() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin]}>
      <GymFeaturePage feature="imports" />
    </Protected>
  )
}
