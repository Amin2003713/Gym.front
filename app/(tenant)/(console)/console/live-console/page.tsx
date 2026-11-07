import { LiveRoom } from '@/app/(tenant)/_components/live/live-room'
import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

export default function ConsoleLivePage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <LiveRoom staff />
    </Protected>
  )
}
