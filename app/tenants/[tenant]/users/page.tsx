import { Suspense } from 'react'

import UsersList from '@/app/tenants/[tenant]/users/_components/users-list'
import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { PublicUser } from '@/types/user.interface'

const getUsers = async () => {
  return readData<PublicUser[]>('user/get-users')
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const error = err as Problem
      return {
        data: null,
        error,
      }
    })
}

export default async function Users() {
  const { data: users, error } = await getUsers()

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <UsersList data={users} error={error} />
    </Suspense>
  )
}
