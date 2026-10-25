import { UserRoleEnum } from '@/enums/user-role.enum'

export const USER_ROLES: Record<UserRoleEnum, string> = {
  [UserRoleEnum.Owner]: 'مالک گروه',
  [UserRoleEnum.Trainer]: 'مربی',
  [UserRoleEnum.Member]: 'عضو باشگاه',
}
