import { AttendanceStatusEnum } from '@/enums/attendance-status.enum'

export const ATTENDANCE_STATUS: Record<
  AttendanceStatusEnum,
  { label: string; color: string }
> = {
  [AttendanceStatusEnum.Present]: {
    label: 'حاضر',
    color: 'bg-success text-success-foreground',
  },
  [AttendanceStatusEnum.Mission]: {
    label: 'ماموریت',
    color: 'bg-info text-info-foreground',
  },
  [AttendanceStatusEnum.Leave]: {
    label: 'مرخصی',
    color: 'bg-warning text-warning-foreground',
  },
  [AttendanceStatusEnum.Holiday]: {
    label: 'تعطیل',
    color: 'bg-muted text-muted-foreground',
  },
  [AttendanceStatusEnum.Absent]: {
    label: 'غایب',
    color: 'bg-destructive/20 text-destructive-foreground',
  },
  [AttendanceStatusEnum.Rest]: {
    label: 'استراحت',
    color: 'bg-warning text-warning-foreground',
  },
}
