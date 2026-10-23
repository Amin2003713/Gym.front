import { isBefore, parseISO } from 'date-fns'
import { z } from 'zod'

import { DayOfWeekEnum } from '@/enums/day-of-week.enum'

const errorMessages = {
  name: 'نام برنامه الزامی می‌باشد.',
  startDate: 'تاریخ شروع الزامی می‌باشد.',
  endDate: 'تاریخ پایان الزامی می‌باشد.',
  startTime: 'ساعت شروع الزامی می‌باشد.',
  endTime: 'ساعت پایان الزامی می‌باشد.',
  holidayOvertimeRate: 'ضریب اضافه‌کار تعطیلات الزامی می‌باشد.',
  normalOvertimeRate: 'ضریب اضافه‌کار روزهای عادی الزامی می‌باشد.',
  timeFormat: 'فرمت ساعت وارد شده معتبر نمی باشد.',
  minRate: 'ضریب حداقل باید 1 باشد.',
  validDecimal: 'ضریب فقط تا 2 رقم اعشار مجاز است.',
}

/** 1440 = 24 h * 60 (1 Day) **/
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper function to check if two time intervals overlap, handling overnight cases
const intervalsOverlap = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean => {
  // Normalize ends if overnight
  if (aEnd <= aStart) aEnd += 1440
  if (bEnd <= bStart) bEnd += 1440

  // Check overlap
  //اگر دیرترین شروع قبل از زودترین پایان باشد → تداخل وجود دارد
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd)
}

// Base schema for overtime rate object
const overtimeRateSchema = z
  .object({
    startTime: z
      .string(errorMessages.startTime)
      .min(1, errorMessages.startTime),
    endTime: z.string(errorMessages.endTime).min(1, errorMessages.endTime),
    rate: z.coerce
      .number('ضریب اضافه کار الزامی می باشد.')
      .min(1, errorMessages.minRate)
      .refine((n) => Number(n.toFixed(2)) === n, {
        message: errorMessages.validDecimal,
      }),
    isLeaveConsidered: z.boolean(),
  })
  .refine(
    ({ startTime, endTime }) => {
      const startMin = timeToMinutes(startTime)
      const endMin = timeToMinutes(endTime)
      // if (endMin <= startMin) endMin += 1440 // Handle overnight
      return startMin <= endMin
    },
    {
      message: 'ساعت پایان باید بعد از ساعت شروع باشد.',
      path: ['endTime'],
    },
  )

// Base schema for exception object
// Assuming exceptions have day and optional overrides; extend as needed
const exceptionSchema = z.object({
  dayOfWeek: z.enum(DayOfWeekEnum),
  // Example optional fields; adjust based on actual requirements
  startTime: z.string(errorMessages.startTime),
  endTime: z.string(errorMessages.endTime),
  // Add more fields if known, e.g., rate: z.number().optional(),
})

// Main shift schema
export const baseSchema = z
  .object({
    name: z.string(errorMessages.name).min(1, { error: errorMessages.name }),
    departments: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
        }),
      )
      .optional()
      .nullable(),
    startDate: z
      .string(errorMessages.startDate)
      .min(1, errorMessages.startDate),
    endDate: z.string(errorMessages.endDate).min(1, errorMessages.endDate),
    startTime: z
      .string(errorMessages.startTime)
      .min(1, errorMessages.startTime),
    endTime: z.string(errorMessages.endTime).min(1, errorMessages.endTime),
    entryDeadlineTime: z.string().optional().nullable(),
    exitDeadlineTime: z.string().optional().nullable(),
    restTime: z.string().optional().nullable(),
    maximumOvertimeTime: z.string().optional().nullable(),
    normalOvertimeRate: z.coerce
      .number(errorMessages.normalOvertimeRate)
      .min(1, errorMessages.minRate)
      .refine((n) => Number(n.toFixed(2)) === n, {
        message: errorMessages.validDecimal,
      }),
    holidayOvertimeRate: z.coerce
      .number(errorMessages.holidayOvertimeRate)
      .min(1, errorMessages.minRate)
      .refine((n) => Number(n.toFixed(2)) === n, {
        message: errorMessages.validDecimal,
      }),
    overtimeRates: z.array(overtimeRateSchema).optional().nullable(),
    exceptions: z.array(exceptionSchema).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate startDate < endDate (strictly less as per query; adjust if <= is intended)
    const startD = parseISO(data.startDate)
    const endD = parseISO(data.endDate)
    if (!isBefore(startD, endD)) {
      ctx.addIssue({
        code: 'custom',
        message: 'تاریخ پایان باید بعد از تاریخ شروع باشد.',
        path: ['endDate'],
      })
    }

    // Validate startTime < endTime for main shift
    const startMin = timeToMinutes(data.startTime)
    const endMin = timeToMinutes(data.endTime)
    if (startMin >= endMin) {
      ctx.addIssue({
        code: 'custom',
        message: 'ساعت پایان باید بعد از ساعت شروع باشد.',
        path: ['endTime'],
      })
    }

    // Validate no overlaps in overtimeRates
    const rates = data.overtimeRates ?? []
    for (let i = 0; i < rates.length; i++) {
      const aStart = timeToMinutes(rates[i].startTime)
      let aEnd = timeToMinutes(rates[i].endTime)
      if (aEnd <= aStart) aEnd += 1440

      for (let j = i + 1; j < rates.length; j++) {
        const bStart = timeToMinutes(rates[j].startTime)
        let bEnd = timeToMinutes(rates[j].endTime)
        if (bEnd <= bStart) bEnd += 1440

        if (intervalsOverlap(aStart, aEnd, bStart, bEnd)) {
          // Add issue to both conflicting items for clarity
          ctx.addIssue({
            code: 'custom',
            message: `بازه زمانی ضریب شخصی با ضریب شخصی ${j + 1} تداخل دارد.`,
            path: ['overtimeRates', i, 'endTime'],
          })
          ctx.addIssue({
            code: 'custom',
            message: `بازه زمانی ضریب شخصی با ضریب شخصی ${i + 1} تداخل دارد.`,
            path: ['overtimeRates', j, 'endTime'],
          })
        }
      }
    }

    // Check that overtimeRates are outside the main shift time range
    const mainStartMin = timeToMinutes(data.startTime)
    const mainEndMin = timeToMinutes(data.endTime)
    // if (mainEndMin <= mainStartMin) mainEndMin += 1440

    rates.forEach((rate, index) => {
      const otStartMin = timeToMinutes(rate.startTime)
      const otEndMin = timeToMinutes(rate.endTime)
      // if (otEndMin <= otStartMin) otEndMin += 1440

      // Check overlap with main shift range
      if (intervalsOverlap(mainStartMin, mainEndMin, otStartMin, otEndMin)) {
        ctx.addIssue({
          code: 'custom',
          message: 'تداخل با زمان برنامه اصلی',
          path: ['overtimeRates', index, 'startTime'],
        })
      }
    })

    // Validate unique days in exceptions
    const dayMap = new Map<DayOfWeekEnum, number[]>()
    data.exceptions?.forEach((exc, index) => {
      const indices = dayMap.get(exc.dayOfWeek) ?? []
      indices.push(index)
      dayMap.set(exc.dayOfWeek, indices)
    })

    dayMap.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((index) => {
          ctx.addIssue({
            code: 'custom',
            message: 'استثنای تکراری برای این روز هفته',
            path: ['exceptions', index, 'dayOfWeek'],
          })
        })
      }
    })
  })

export const addPlanSchema = baseSchema
export const updatePlanSchema = baseSchema.safeExtend({
  id: z.string('شناسه برنامه یافت نشد!').min(1, 'شناسه برنامه یافت نشد!'),
})
