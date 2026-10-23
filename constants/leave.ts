import { LeaveStatusEnum, LeaveTypeEnums } from '@/enums/leave.enums'

export const LEAVE_TYPE: Record<LeaveTypeEnums, string> = {
  [LeaveTypeEnums.Entitlement]: 'مرخصی استحقاقی',
  [LeaveTypeEnums.Illness]: 'مرخصی استعلاجی',
  [LeaveTypeEnums.WithoutSalary]: 'مرخصی بدون حقوق',
  [LeaveTypeEnums.Maternity]: 'مرخصی زایمان',
  [LeaveTypeEnums.Marriage]: 'مرخصی ازدواج',
}

export const LEAVE_STATUS: Record<
  LeaveStatusEnum,
  { label: string; color: string }
> = {
  [LeaveStatusEnum.UnderReview]: {
    label: 'در انتطار تایید',
    color: 'text-info-foreground bg-info',
  },
  [LeaveStatusEnum.Approved]: {
    label: 'تایید شده',
    color: 'text-success-foreground bg-success',
  },
  [LeaveStatusEnum.Rejected]: {
    label: 'رد شده',
    color: 'bg-destructive/20 text-destructive-foreground',
  },
}
