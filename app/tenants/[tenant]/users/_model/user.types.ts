import { z } from 'zod'
import { userSchema, updateUserSchema, updateUserSimSerialSchema } from './user.schema'

export type AddUserModel = z.infer<typeof userSchema>
export type UpdateUserModel = z.infer<typeof updateUserSchema>
export type UpdateUserSimSerialModel = z.infer<typeof updateUserSimSerialSchema>

export type ApiUserRole = 'Admin' | 'Tranner' | 'Trainee'
export interface ApiUser {
  id: string
  username?: string | null
  email?: string | null
  phoneNumber?: string | null
  phoneCountryCode?: string | null
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  role?: string[] | string | null
  gender?: number | null
  lastAction?: string | null
  isActive?: boolean
  createdAt?: string
  clientId?: string | null
  tenantId?: string | null
  disabled?: boolean
  verified?: boolean
  scheduledDeletionAt?: string | null
  jobTitle?: string | null
}

export interface PagedResult<T> {
  results: T[]
  currentPage: number
  pageCount: number
  pageSize: number
  rowCount: number
}

export interface UserLogQuery {
  from: string
  to: string
  pageNumber?: number
  pageSize?: number
  searchString?: string
}
