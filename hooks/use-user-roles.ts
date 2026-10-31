import { useSession } from 'next-auth/react'

import { normalizeApiUserRole } from '@/constants/user-role'
import { ApiUserRole } from '@/features/users/api/users-api'

export type PrimaryRole = ApiUserRole.Admin | ApiUserRole.Trainer | ApiUserRole.Trainee

/**
 * Normalizes role values returned by the API/session. The backend sends
 * integer role values (C# Roles enum), with older string roles still mapped.
 */
export function normalizeRole(
  value: string | number | null | undefined,
): PrimaryRole | null {
  return normalizeApiUserRole(value)
}

export function useUserRoles() {
  const { data: session } = useSession()
  const sessionRoles = session?.user?.role ?? []
  const rawRoles = (
    Array.isArray(sessionRoles) ? sessionRoles : [sessionRoles]
  ).map(String)

  const roles = rawRoles
    .map(normalizeApiUserRole)
    .filter((role): role is PrimaryRole => role !== null)

  const isAdmin = roles.includes(ApiUserRole.Admin)
  const isTrainer = roles.includes(ApiUserRole.Trainer)
  const isTrainee = roles.includes(ApiUserRole.Trainee)

  /** Only Admin (Owner) and Trainer may manage/assign content; a member never can. */
  const canManage = isAdmin || isTrainer
  /** Trainee-only sign-in: read-only views on shared content. */
  const isTraineeOnly = !isAdmin && !isTrainer

  return { roles, isAdmin, isTrainer, isTrainee, canManage, isTraineeOnly }
}
