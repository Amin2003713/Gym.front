import { createData, deleteData, readData, updateData } from '@/core/http-service'

/** Mirrors Domain.Users.User and the UserController response contract. */
export interface UserDto {
  id: string
  username: string
  email: string
  phoneNumber?: string | null
  phoneCountryCode?: string | null
  firstName: string
  lastName: string
  fullName?: string | null
  avatar?: string | null
  role?: string[] | null
  gender?: number | null
  lastAction?: string | null
  isActive: boolean
  createdAt?: string | null
  clientId?: string | null
  tenantId?: string | null
  disabled: boolean
  verified: boolean
  scheduledDeletionAt?: string | null
}

/** C# Roles enum uses byte values: Admin=0, Trainer=1, Trainee=2. */
export enum ApiUserRole {
  Admin = 0,
  Trainer = 1,
  Trainee = 2,
}

export interface CreateUserInput {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  phoneCountryCode: string
  avatar?: string | null
  gender?: number | null
  role: ApiUserRole
  jobTitle?: string | null
  password?: string | null
  confirmPassword?: string | null
}

export interface UpdateUserInput extends CreateUserInput {
  id: string
}

const root = 'user'

export const usersApi = {
  list: () => readData<UserDto[]>(`${root}/List-Users`),
  info: (userId?: string) => readData<UserDto>(`${root}/User-Info${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  create: (input: CreateUserInput) => createData<CreateUserInput, unknown>(root, input),
  update: (input: UpdateUserInput) => updateData<UpdateUserInput, unknown>(root, input),
  disable: (userId: string) => updateData<undefined, unknown>(`${root}/disable?userId=${encodeURIComponent(userId)}`, undefined),
  forceResetPassword: (userId: string) => updateData<undefined, unknown>(`${root}/force-password-reset?userId=${encodeURIComponent(userId)}`, undefined),
  remove: (userId: string) => deleteData(`${root}?userId=${encodeURIComponent(userId)}`),
}
