import { useSession } from 'next-auth/react'

import { UserRoleEnum } from '@/enums/user-role.enum'

export type PrimaryRole = UserRoleEnum.Owner | UserRoleEnum.Trainer | UserRoleEnum.Member

/**
 * Normalizes role values returned by the API/session:
 * enum names (Admin/Trainer/Trainee) or UI slugs (owner/trainer/member).
 */
export function normalizeRole(value: string): PrimaryRole | null {
  const normalized = value.toLowerCase().replace(/[ _-]/g, '')
  if (normalized === 'owner' || normalized === 'admin') return UserRoleEnum.Owner
  if (normalized === 'trainer') return UserRoleEnum.Trainer
  if (normalized === 'trainee' || normalized === 'member') return UserRoleEnum.Member
  return null
}

export function useUserRoles() {
  const { data: session } = useSession()
  const sessionRoles = session?.user?.role ?? []
  const rawRoles = (Array.isArray(sessionRoles) ? sessionRoles : [sessionRoles]).map(String)

  const roles = rawRoles.map(normalizeRole).filter((role): role is PrimaryRole => role !== null)

  const isAdmin = roles.includes(UserRoleEnum.Owner)
  const isTrainer = roles.includes(UserRoleEnum.Trainer)
  const isTrainee = roles.includes(UserRoleEnum.Member)

  /** Admin (Owner) and Trainer may manage/assign content. */
  const canManage = !isTrainee || isAdmin || isTrainer
  /** Trainee-only sign-in: read-only views on shared content. */
  const isTraineeOnly = !isAdmin && !isTrainer

  return { roles, isAdmin, isTrainer, isTrainee, canManage, isTraineeOnly }
}
