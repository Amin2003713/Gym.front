import { useQuery } from '@tanstack/react-query'

import { readData } from '@/core/http-service'
import { CalendarInfo } from '@/types/dashboard.interfaces'
import { Problem } from '@/types/http-errors.interface'

const getCalendarInfo = async (year: string, month: string) =>
  await readData<CalendarInfo[]>(
    `dashboard/calendar?year=${year}&month=${month}`,
  )

export const useGetCalendarInfo = (year: string, month: string) => {
  const query = useQuery<CalendarInfo[], Problem>({
    queryKey: ['dashboard-calendar-info', year, month],
    queryFn: () => getCalendarInfo(year, month),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000,
  })

  return {
    ...query,
    data: query.data ?? [],
  }
}
