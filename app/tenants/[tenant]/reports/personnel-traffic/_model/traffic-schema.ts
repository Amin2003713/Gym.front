import { isBefore } from 'date-fns'
import { z } from 'zod'

const errorMessages = {
  dateRequired: 'تاریخ الزامی می باشد.',
  enterTimeRequired: 'زمان ورود الزامی می باشد.',
  enterStationRequired: 'ایستگاه ورود الزامی می باشد.',
  exitStationRequired: 'ایستگاه خروج الزامی می باشد.',
  exitTimeRequired: 'زمان خروج الزامی می باشد.',
  invalidTimeRange: 'زمان ورود نمی‌تواند از زمان خروج بزرگتر یا برابر باشد.',
}

const isNonEmptyString = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0

export const baseTrafficSchema = z.object({
  date: z
    .string({ error: errorMessages.dateRequired })
    .min(1, errorMessages.dateRequired),
  enterTime: z
    .string({ error: errorMessages.enterTimeRequired })
    .min(1, errorMessages.enterTimeRequired),
  exitTime: z.string().optional().nullable(),
  userId: z.string().min(1, 'شناسه کاربر الزامی می باشد.'),
  enterStationId: z
    .string({ error: errorMessages.enterStationRequired })
    .min(1, errorMessages.enterStationRequired),
  exitStationId: z.string().optional().nullable(),
})

const applyTrafficRefine = (schema: typeof baseTrafficSchema) =>
  schema
    .refine(
      // Check if exitTime is provided, then exitStationId must be provided
      (data) =>
        !isNonEmptyString(data.exitTime) ||
        isNonEmptyString(data.exitStationId),
      {
        message: errorMessages.exitStationRequired,
        path: ['exitStationId'],
      },
    )
    .refine(
      // Check if exitTime is provided, then exitStationId must be provided
      (data) =>
        !isNonEmptyString(data.exitStationId) ||
        isNonEmptyString(data.exitTime),
      {
        message: errorMessages.exitTimeRequired,
        path: ['exitTime'],
      },
    )
    .refine(
      // Check enterTime must not be greater than exitTime
      (data) => {
        if (
          isNonEmptyString(data.enterTime) &&
          isNonEmptyString(data.exitTime)
        ) {
          try {
            const enterDate = `2025-10-19T${data.enterTime}`
            const exitDate = `2025-10-19T${data.exitTime!}`
            return isBefore(enterDate, exitDate)
          } catch {
            return false // Invalid date format
          }
        }
        return true
      },
      {
        message: errorMessages.invalidTimeRange,
        path: ['enterTime'],
      },
    )

export const addTrafficSchema = applyTrafficRefine(baseTrafficSchema)
export const updateTrafficSchema = applyTrafficRefine(
  baseTrafficSchema.extend({
    id: z.string(),
  }),
)
