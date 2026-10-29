import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { ApiUserRole } from '@/features/users/api/users-api'
import { PublicUser } from '@/types/user.interface'

interface UserStore {
  user?: PublicUser
  isAdmin: boolean
  setUser: (user: PublicUser) => void
  removeUser: () => void
}

export const useUserStore = create<UserStore>()(
  devtools((set) => ({
    user: undefined,
    isAdmin: false,
    setUser: (user) => set({
      user,
      isAdmin: user.role.some((role) => [ApiUserRole.Admin, ApiUserRole.Trainer].includes(role)),
    }),
    removeUser: () => set({ user: undefined, isAdmin: false }),
  })),
)
