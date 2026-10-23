import { LeaveStatusEnum, LeaveTypeEnums } from '@/enums/leave.enums'
import { Media } from '@/types/media.interface'
import { PublicUser } from '@/types/user.interface'

export interface Leave {
  id: string
  status: LeaveStatusEnum
  type: LeaveTypeEnums
  startDate: string
  endDate: string
  description: null
  media: Media[]
  user: PublicUser
  adminComment: null
  reviewedBy?: PublicUser | null
  reviewedAt: null
  createdAt: string
  inserter: PublicUser
}
