import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

import { BillingConsole } from './_components/billing-console'

export const metadata = { title: 'مالی و اشتراک' }

export default function Page() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin]}>
      <BillingConsole />
    </Protected>
  )
}
