import UserManager from '@/app/(tenant)/users/_components/user-manager'
import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

export default function MembersPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <UserManager
        title="اعضای باشگاه"
        description="مدیریت شاگردان گروه، وضعیت عضویت و حساب‌هایشان"
        role={ApiUserRole.Trainee}
      />
    </Protected>
  )
}
