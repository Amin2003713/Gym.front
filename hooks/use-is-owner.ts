import { useSession } from 'next-auth/react'

export function useIsOwner(ownerId: string) {
  const { data: session } = useSession()
  const userId = session?.user.id

  const isOwner = userId === ownerId

  return {
    isOwner,
  }
} 