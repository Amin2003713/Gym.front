import { z } from 'zod'

export const trafficRangeSchema = z.object({
  userId: z.string('کاربری انتخاب نشده است.'),
  month: z.string('ماه مورد نظر را انتخاب کنید.'),
  year: z.string('سال مورد نظر را انتخاب کنید.'),
})
