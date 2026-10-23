import { useQuery } from '@tanstack/react-query'

import { TrafficRangeType } from '@/app/tenants/[tenant]/reports/personnel-traffic/_model'
import { readData } from '@/core/http-service'
import { DownloadInterface } from '@/types/download.interface'
import { Problem } from '@/types/http-errors.interface'
import { Station } from '@/types/station.interface'
import { downloadFileFromUrl } from '@/utils/download-file-from-url'

const getStations = async () =>
  await readData<Station[]>('station/get-stations')

export const useGetStations = () => {
  const query = useQuery<Station[], Problem>({
    queryKey: ['get-stations'],
    queryFn: getStations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 6 * 60 * 1000,
  })

  return {
    stations: query.data?.map((d) => ({ id: d.id, label: d.name })) ?? [],
    ...query,
  }
}

export const getTrafficExcel = async ({
  userId,
  year,
  month,
}: TrafficRangeType) => {
  return await readData<DownloadInterface>(`excel/records-excel`, {
    params: {
      userId,
      year,
      month,
    },
  }).then(
    async ({ url, fileName, mimeType }) =>
      await downloadFileFromUrl(url, { fileName, mimeType }),
  )
}
