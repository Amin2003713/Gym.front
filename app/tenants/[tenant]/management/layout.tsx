import { Protected } from '@/components/auth/protected'
import { UserRoleEnum } from '@/enums/user-role.enum'

const ManagementLayout = ({ children }: { children: React.ReactNode }) => (
  <Protected requiredRoles={[UserRoleEnum.Admin]}>{children}</Protected>
)

export default ManagementLayout
