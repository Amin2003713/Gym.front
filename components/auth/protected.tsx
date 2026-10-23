'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'
import { toast } from 'sonner'

import { UserRoleEnum } from '@/enums/user-role.enum'

interface ProtectedProps {
  children: ReactNode
  requiredRoles?: UserRoleEnum[]
  fallbackPath?: string
  loadingComponent?: ReactNode
  unauthorizedComponent?: ReactNode
}

export function Protected({
  children,
  requiredRoles = [],
  fallbackPath = '/',
  loadingComponent = (
    <div className="flex h-svh items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  ),
  unauthorizedComponent,
}: ProtectedProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userRoles = session?.user?.role ?? []
  const hasAccess =
    requiredRoles.length === 0 ||
    requiredRoles.some((role) => userRoles.includes(role))

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin')
      toast.error('دسترسی غیر مجاز!', {
        description: 'کاربر عزیز، شما دسترسی مجاز به این صفحه را ندارید.',
      })
    } else if (status === 'authenticated') {
      if (!hasAccess) {
        router.replace(fallbackPath)
        toast.error('دسترسی غیر مجاز!', {
          description: 'کاربر عزیز، شما دسترسی مجاز به این صفحه را ندارید.',
        })
      }
    }
  }, [fallbackPath, hasAccess, router, status])

  if (status === 'loading') return <>{loadingComponent}</>
  if (status === 'unauthenticated') return null

  if (!hasAccess) return <>{unauthorizedComponent}</>

  return <>{children}</>
}
