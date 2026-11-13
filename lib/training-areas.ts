/**
 * Disciplines a gym can offer. Codes mirror Domain.Base.Gyms.Enums.TrainingAreas and are what the
 * API stores; labels are display-only. Picking areas narrows the exercise library server-side.
 */
export const TRAINING_AREAS = [
  { code: 'strength', label: 'قدرتی و بدنسازی' },
  { code: 'pilates', label: 'پیلاتس' },
  { code: 'yoga', label: 'یوگا' },
  { code: 'calisthenics', label: 'کالیستنیکس' },
  { code: 'cardio', label: 'هوازی و کاردیو' },
  { code: 'combat', label: 'رزمی' },
  { code: 'mobility', label: 'تحرک و کشش' },
  { code: 'plyometrics', label: 'پلایومتریک' },
  { code: 'olympic', label: 'وزنه‌برداری المپیک' },
] as const

export type TrainingAreaCode = (typeof TRAINING_AREAS)[number]['code']

export const TRAINING_AREA_LABEL: Record<string, string> = Object.fromEntries(
  TRAINING_AREAS.map((area) => [area.code, area.label]),
)
