import { useQuery } from '@tanstack/react-query'

import { readData } from '@/core/http-service'
import { Department } from '@/types/department.interface'
import { Problem } from '@/types/http-errors.interface'

const getDepartments = async () =>
  await readData<Department[]>('department/get-departments')

export const useGetDepartments = () => {
  const query = useQuery<Department[], Problem>({
    queryKey: ['get-departments'],
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 6 * 60 * 1000,
  })

  return {
    departments: query.data?.map((d) => ({ id: d.id, label: d.title })) ?? [],
    ...query,
  }
}
