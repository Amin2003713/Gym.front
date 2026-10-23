import { useQuery } from '@tanstack/react-query'

import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { PublicUser } from '@/types/user.interface'

const getUsers = async () => await readData<PublicUser[]>('user/get-users')

export const useGetUsers = () => {
  const query = useQuery<PublicUser[], Problem>({
    queryKey: ['get-users'],
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 6 * 60 * 1000,
  })

  return {
    users:
      query.data?.map((u) => ({
        ...u,
        id: u.id,
        label: `${u.firstName} ${u.lastName}`,
      })) ?? [],
    ...query,
  }
}
