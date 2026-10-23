import { StationStatus, StationType } from '@/enums/station.enums'

export const STATION_STATUS: Record<StationStatus, string> = {
  [StationStatus.Complete]: 'کامل',
  [StationStatus.Incomplete]: 'ناقص',
  [StationStatus.None]: 'هیچ‌کدام',
  [StationStatus.OutOfRange]: 'خارج از محدوده',
}

export const STATION_TYPE: Record<StationType, string> = {
  [StationType.Traffic]: 'تردد',
  [StationType.Mission]: 'ماموریت',
}
