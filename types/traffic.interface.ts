import { AttendanceStatusEnum } from '@/enums/attendance-status.enum'

export interface TrafficInterface {
  date: string
  hint: AttendanceStatusEnum
  records: TrafficRecordInterface[]
  attendanceTime: string
  overTime: string
  deficitTime: string
}

export interface TrafficRecordInterface {
  id: string
  enterTime: string
  exitTime: null
  enterStation: Station
  exitStation: Station
  enterStationDistance: string | null // when user add record
  enterInserter: string | null // when admin add record
  exitStationDistance: string | null // when user add record
  exitInserter: string | null // when admin add record
  planId: string
}

type Station = { id: string; name: string }
