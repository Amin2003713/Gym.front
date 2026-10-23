import z from 'zod'

import { LeaveStatusEnum } from '@/enums/leave.enums'

import { addLeaveSchema, updateLeaveSchema } from './leave.schema'

export type AddLeaveModel = z.infer<typeof addLeaveSchema>
export type UpdateLeaveModel = z.infer<typeof updateLeaveSchema>

export type ReviewLeaveModel = {
  id: string
  status: LeaveStatusEnum
  adminComment?: string
}
