import { DayOfWeekEnum } from '@/enums/day-of-week.enum'

export const DAY_OF_WEEK: Record<DayOfWeekEnum, string> = {
  [DayOfWeekEnum.Saturday]: 'شنبه',
  [DayOfWeekEnum.Sunday]: 'یکشنبه',
  [DayOfWeekEnum.Monday]: 'دوشنبه',
  [DayOfWeekEnum.Tuesday]: 'سه شنبه',
  [DayOfWeekEnum.Wednesday]: 'چهارشنبه',
  [DayOfWeekEnum.Thursday]: 'پنجشنبه',
  [DayOfWeekEnum.Friday]: 'جمعه',
}
