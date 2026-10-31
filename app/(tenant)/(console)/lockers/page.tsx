import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

import { LockerConsole } from './_components/locker-console'

export const metadata = { title: 'کمدهای هوشمند' }

export default function Page() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin]}>
      <LockerConsole />
    </Protected>
  )
}
