import { createData, deleteData, readData, updateData } from '@/core/http-service'
import type { ApiUser, PagedResult, UserLogQuery } from '../_model/user.types'

const BASE = 'user'

export const listUsers = () => readData<ApiUser[]>(`${BASE}/List-Users`)
export const getUserInfo = (userId?: string) =>
  readData<ApiUser>(`${BASE}/User-Info${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`)
export const createUser = (payload: unknown) => createData<unknown, void>(BASE, payload)
export const updateUser = (payload: unknown) => updateData<unknown, void>(BASE, payload)
export const disableUser = (userId: string) =>
  updateData<null, void>(`${BASE}/disable?userId=${encodeURIComponent(userId)}`, null)
export const deleteUser = (userId: string) =>
  deleteData(`${BASE}?userId=${encodeURIComponent(userId)}`)
export const forcePasswordReset = (userId: string) =>
  updateData<null, void>(`${BASE}/force-password-reset?userId=${encodeURIComponent(userId)}`, null)
export const getUserLogs = (query: UserLogQuery) => {
  const params = new URLSearchParams({
    From: query.from,
    To: query.to,
    PageNumber: String(query.pageNumber ?? 1),
    PageSize: String(query.pageSize ?? 10),
    ...(query.searchString ? { SearchString: query.searchString } : {}),
  })
  return readData<PagedResult<ApiUser>>(`${BASE}/user-logs?${params.toString()}`)
}
