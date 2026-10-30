import UserManager from '@/app/(tenant)/(console)/users/_components/user-manager'
import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

export default function UsersPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <UserManager
        title="مدیریت کاربران"
        description="مدیریت هویت و دسترسی مدیران، مربی‌ها و شاگردهای باشگاه"
      />
    </Protected>
  )
}
