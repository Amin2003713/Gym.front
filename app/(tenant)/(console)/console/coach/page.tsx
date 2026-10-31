import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

import { CoachInbox } from './_components/coach-inbox'

export const metadata = { title: 'صف مربی' }

export default function Page() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <CoachInbox />
    </Protected>
  )
}
