import { UserRoleEnum } from '@/enums/user-role.enum'

export interface SignedInUser {
  token: string
}

export interface User {
  accessToken: string
  firstName: string
  id: string
  lastName: string
  phoneNumber: string
  imageUrl: string | null
  imageUrlCompress: string | null
  role: UserRoleEnum[]
  username: string
}

type SafeUser = Omit<User, 'accessToken'>

/** User profile exposed to the gym-group tenant UI. */
export interface PublicUser extends SafeUser {
  name: string
  address?: string | null
  branchId?: string | null
  branchName?: string | null
  isActive?: boolean
  trainerId?: string | null
  membershipStatus?: 'active' | 'paused' | 'expired' | null
}

export interface UserSession extends User {}
