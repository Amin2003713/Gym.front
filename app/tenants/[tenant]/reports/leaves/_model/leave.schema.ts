import { isBefore, parseISO } from 'date-fns'
import z from 'zod'

import { LeaveStatusEnum, LeaveTypeEnums } from '@/enums/leave.enums'
import { mediaSchema } from '@/utils/media.schema'

const leaveSchema = z
  .object({
    userId: z
      .string('کابر مورد نظر را انتخاب کنید.')
      .min(1, { error: 'کابر مورد نظر را انتخاب کنید.' }),
    type: z.enum(LeaveTypeEnums, { error: 'نوع مرخصی الزامی است.' }),
    status: z.enum(LeaveStatusEnum, { error: 'وضعیت مرخصی الزامی است.' }),
    startDate: z
      .string('تاریخ شروع مرخصی الزامی است.')
      .min(1, { error: 'تاریخ شروع مرخصی الزامی است.' }),
    endDate: z
      .string('تاریخ پایان مرخصی الزامی است.')
      .min(1, { error: 'تاریخ پایان مرخصی الزامی است.' }),
    description: z.string().optional().nullable(),
    mediaFiles: z
      .array(z.file())
      .max(5, { error: 'حداکثر پیوست مجاز 5 عدد می باشد.' })
      .optional()
      .nullable(),
  })
  .refine(
    ({ startDate, endDate }) => {
      const startD = parseISO(startDate)
      const endD = parseISO(endDate)
      return isBefore(startD, endD)
    },
    {
      error: 'تاریخ پایان باید پس از تاریخ شروع باشد.',
      path: ['endDate'],
    },
  )

export const addLeaveSchema = leaveSchema
export const updateLeaveSchema = leaveSchema.safeExtend({
  id: z.string(),
  mediaUrls: z.array(mediaSchema).optional().nullable(),
})
