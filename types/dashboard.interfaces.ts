import { DayOfWeekEnum } from '@/enums/day-of-week.enum'
import { LeaveStatusEnum } from '@/enums/leave.enums'
import { RequestTypeEnum } from '@/enums/request-type.enum'

export interface CalendarInfo {
  date: string
  isHoliday: boolean
  isCustomHoliday: boolean
  hasReminder: boolean
  presentCount: string
  absentCount: string
}

export interface TodaySummary {
  totalUsers: number
  presentUsers: number
  onMissionUsers: number
  requests: number
}

export interface EmployeesDistribution {
  departmentId: string
  departmentName: string
  staffCount: number
}

export interface WeeklyAttendance {
  dayOfWeek: DayOfWeekEnum
  presentCount: number
  absentCount: number
}

export interface LatestRequests {
  id: string
  requester: string
  requestType: RequestTypeEnum
  duration: string
  status: LeaveStatusEnum
  requestedAt: string
}
