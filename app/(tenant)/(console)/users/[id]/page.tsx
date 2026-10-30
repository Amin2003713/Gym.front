import { Suspense } from 'react'

import UserEditor from '@/app/(tenant)/(console)/users/_components/user-editor'
import { Protected } from '@/components/auth/protected'
import { readData } from '@/core/http-service'
import { ApiUserRole } from '@/features/users/api/users-api'
import { Problem } from '@/types/http-errors.interface'

import type { ApiUser } from '../_model/user.types'

async function getUser(id: string) {
  return readData<ApiUser>(`user/User-Info?userId=${encodeURIComponent(id)}`)
    .then((data) => ({ data, error: null as Problem | null }))
    .catch((err: unknown) => ({
      data: null,
      error: err as Problem,
    }))
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: user } = await getUser(id)

  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <div className="p-1">
        {user ? (
          <Suspense>
            <UserEditor mode="edit" user={user} />
          </Suspense>
        ) : (
          <div className="text-muted-foreground py-16 text-center">
            کاربر پیدا نشد.
          </div>
        )}
      </div>
    </Protected>
  )
}
