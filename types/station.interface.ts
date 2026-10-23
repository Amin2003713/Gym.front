import { StationStatus, StationType } from '@/enums/station.enums'

export interface Station {
  id: string
  name: string
  code: string
  latitude: number
  longitude: number
  allowedDistance: number
  onWay: string | null
  address: string | null
  stationStatus: StationStatus
  stationType: StationType
}
