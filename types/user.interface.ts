import { GenderEnum } from '@/enums/gender.enum'
import { ApiUserRole } from '@/features/users/api/users-api'

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
  gender: GenderEnum | null
  imageUrlCompress: string | null
  role: ApiUserRole[]
  username: string
}

type SafeUser = Omit<User, 'accessToken'>

/** User profile exposed to the gym-group tenant UI. */
export interface PublicUser extends SafeUser {
  name: string
  address?: string | null
  isActive?: boolean
  gender: GenderEnum | null
  trainerId?: string | null
  membershipStatus?: 'active' | 'paused' | 'expired' | null
  /** Legacy field kept optional so older admin screens still type-check. */
  simSerial?: string | null
}

export interface UserSession extends User {}
