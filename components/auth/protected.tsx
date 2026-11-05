'use client'

import { Loader2 } from '@/components/icons'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'

import { ApiUserRole } from '@/features/users/api/users-api'
import { normalizeApiUserRole } from '@/constants/user-role'
import { toast } from '@/lib/toast'

interface ProtectedProps {
  children: ReactNode
  requiredRoles?: ApiUserRole[]
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
  // The backend sends integer role values (C# Roles enum); older payloads may
  // still carry enum names. Normalize both before the access check.
  const rawRoles = Array.isArray(session?.user?.role)
    ? session.user.role
    : session?.user?.role
      ? [session.user.role]
      : []
  const userRoles = rawRoles
    .map((role) => normalizeApiUserRole(role as string | number | null | undefined))
    .filter((role): role is ApiUserRole => role !== null)
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
