import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { UserRoleEnum } from '@/enums/user-role.enum'
import { PublicUser } from '@/types/user.interface'

interface UserStore {
  user?: PublicUser
  isAdmin: boolean
  isBranchManager: boolean
  setUser: (user: PublicUser) => void
  removeUser: () => void
}

export const useUserStore = create<UserStore>()(
  devtools((set) => ({
    user: undefined,
    isAdmin: false,
    isBranchManager: false,
    setUser: (user) => set({
      user,
      isAdmin: user.role.some((role) => [UserRoleEnum.Owner, UserRoleEnum.Admin].includes(role)),
      isBranchManager: user.role.includes(UserRoleEnum.BranchManager),
    }),
    removeUser: () => set({ user: undefined, isAdmin: false, isBranchManager: false }),
  })),
)
