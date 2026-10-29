import { ApiUserRole } from '@/features/users/api/users-api'

export const USER_ROLES: Record<ApiUserRole, string> = {
  [ApiUserRole.Admin]: 'مدیر باشگاه',
  [ApiUserRole.Trainer]: 'مربی',
  [ApiUserRole.Trainee]: 'شاگرد',
}

/**
 * The backend sends roles as integer values (C# Roles byte values:
 * Admin=0, Trainer=1, Trainee=2), sometimes as names in older payloads.
 * Both forms normalize into the same enum.
 */
export function normalizeApiUserRole(
  value?: string | number | null,
): ApiUserRole | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  const key = String(value).toLowerCase().replace(/[ _-]/g, '')
  if (key === '0' || key === 'admin' || key === 'administrator' || key === 'owner')
    return ApiUserRole.Admin
  if (key === '1' || key === 'trainer') return ApiUserRole.Trainer
  if (key === '2' || key === 'trainee' || key === 'member')
    return ApiUserRole.Trainee
  return null
}
