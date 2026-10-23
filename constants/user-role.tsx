import { UserRoleEnum } from '@/enums/user-role.enum'

export const USER_ROLES: Record<UserRoleEnum, string> = {
  [UserRoleEnum.Owner]: 'مالک گروه',
  [UserRoleEnum.Admin]: 'مدیر گروه',
  [UserRoleEnum.BranchManager]: 'مدیر شعبه',
  [UserRoleEnum.Trainer]: 'مربی',
  [UserRoleEnum.Member]: 'عضو باشگاه',
}
