import { DayOfWeekEnum } from '@/enums/day-of-week.enum'
import { Department } from '@/types/department.interface'

export interface Plan {
  id: string
  name: string
  departments?: Department[] | null
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  entryDeadlineTime?: string
  exitDeadlineTime?: string
  restTime?: string
  maximumOvertimeTime?: string
  normalOvertimeRate?: number
  holidayOvertimeRate?: number
  exceptions?: Exception[] | null
  overtimeRates?: OvertimeRate[] | null
}

export type OvertimeRate = {
  startTime: string
  endTime: string
  rate: number
  isLeaveConsidered: boolean
}

export type Exception = {
  dayOfWeek: DayOfWeekEnum
  startTime: string
  endTime: string
}
