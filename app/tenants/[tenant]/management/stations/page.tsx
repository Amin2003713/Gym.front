import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { Station } from '@/types/station.interface'

import StationsList from './_components/stations-list'

const getStations = async () => {
  return readData<Station[]>('station/get-stations')
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const error = err as Problem
      return {
        data: null,
        error,
      }
    })
}

export default async function StationsManagement() {
  const { data: stations, error } = await getStations()

  return (
    <>
      {/*<StationsKpi/>*/}
      <StationsList data={stations} error={error} />
    </>
  )
}
