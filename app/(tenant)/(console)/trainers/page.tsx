import UserManager from '@/app/(tenant)/(console)/users/_components/user-manager'
import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

export default function TrainersPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <UserManager
        title="مربی‌ها و شاگردها"
        description="مدیریت مربی‌های گروه و ایجاد حساب برای آن‌ها"
        role={ApiUserRole.Trainer}
      />
    </Protected>
  )
}
