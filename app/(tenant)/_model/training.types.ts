/** Contracts of the /training endpoints (Application/Training + TrainingController). */

export interface BodyMeasurement {
  id: string
  date: string
  weightKg: number | null
  bodyFatPercent: number | null
  neckCm: number | null
  shoulderCm: number | null
  chestCm: number | null
  waistCm: number | null
  hipsCm: number | null
  armLeftCm: number | null
  armRightCm: number | null
  forearmLeftCm: number | null
  forearmRightCm: number | null
  thighLeftCm: number | null
  thighRightCm: number | null
  calfLeftCm: number | null
  calfRightCm: number | null
  restingHeartRateBpm: number | null
  sleepHours: number | null
  energyLevel: number | null
  note: string | null
}

/** First vs latest value of one metric across a member's history. */
export interface MeasurementTrend {
  first: number | null
  latest: number | null
  change: number | null
  firstDate: string | null
  latestDate: string | null
}

export interface MeasurementSummary {
  memberUserId: string
  entries: number
  lastMeasuredOn: string | null
  weightKg: MeasurementTrend
  bodyFatPercent: MeasurementTrend
  waistCm: MeasurementTrend
  chestCm: MeasurementTrend
  armLeftCm: MeasurementTrend
  armRightCm: MeasurementTrend
  thighLeftCm: MeasurementTrend
  thighRightCm: MeasurementTrend
  latestRestingHeartRateBpm: number | null
  latestSleepHours: number | null
  latestEnergyLevel: number | null
}

export interface WeeklyActivityDay {
  date: string
  isToday: boolean
  isFuture: boolean
  sessions: number
  volumeKg: number
}

export interface BodyWeightPoint {
  date: string
  weightKg: number
}

export interface MemberHome {
  today: string
  currentStreakDays: number
  sessionsThisWeek: number
  volumeThisWeekKg: number
  lastSessionAt: string | null
  latestMeasurement: BodyMeasurement | null
  week: WeeklyActivityDay[]
  totalWorkouts: number
  totalVolumeKg: number
  /** Exercises whose best estimated 1RM of the last 30 days is still their best of 180. */
  personalRecords: number
  averageRestSeconds: number
  consistencyDays: number
  bodyWeightTrend: BodyWeightPoint[] | null
}

/**
 * Everything the measurement form can send. The backend upserts per day, so an omitted field clears
 * that day's value - the form always sends the full set it collected.
 */
export interface UpsertMeasurementInput {
  date: string
  weightKg?: number | null
  bodyFatPercent?: number | null
  neckCm?: number | null
  shoulderCm?: number | null
  chestCm?: number | null
  waistCm?: number | null
  hipsCm?: number | null
  armLeftCm?: number | null
  armRightCm?: number | null
  forearmLeftCm?: number | null
  forearmRightCm?: number | null
  thighLeftCm?: number | null
  thighRightCm?: number | null
  calfLeftCm?: number | null
  calfRightCm?: number | null
  restingHeartRateBpm?: number | null
  sleepHours?: number | null
  energyLevel?: number | null
  note?: string | null
}

/** One labelled input of the measurement form, so the UI stays a data loop. */
export interface MeasurementField {
  key: keyof Omit<UpsertMeasurementInput, 'date' | 'note'>
  label: string
  group: 'composition' | 'circumference' | 'vitals'
  unit?: string
  step?: number
  min?: number
  max?: number
}

export const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: 'weightKg', label: 'وزن', group: 'composition', unit: 'kg', step: 0.1, min: 20, max: 500 },
  {
    key: 'bodyFatPercent',
    label: 'چربی بدن',
    group: 'composition',
    unit: '٪',
    step: 0.1,
    min: 0,
    max: 100,
  },
  { key: 'neckCm', label: 'گردن', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'shoulderCm', label: 'شانه', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'chestCm', label: 'سینه', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'waistCm', label: 'کمر', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'hipsCm', label: 'باسن', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'armLeftCm', label: 'بازوی چپ', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'armRightCm', label: 'بازوی راست', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'forearmLeftCm', label: 'ساعد چپ', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'forearmRightCm', label: 'ساعد راست', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'thighLeftCm', label: 'ران چپ', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'thighRightCm', label: 'ران راست', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'calfLeftCm', label: 'ساق چپ', group: 'circumference', unit: 'cm', step: 0.1 },
  { key: 'calfRightCm', label: 'ساق راست', group: 'circumference', unit: 'cm', step: 0.1 },
  {
    key: 'restingHeartRateBpm',
    label: 'ضربان استراحت',
    group: 'vitals',
    unit: 'bpm',
    step: 1,
    min: 30,
    max: 220,
  },
  { key: 'sleepHours', label: 'خواب شب', group: 'vitals', unit: 'ساعت', step: 0.5, min: 0, max: 24 },
  { key: 'energyLevel', label: 'انرژی (۱ تا ۵)', group: 'vitals', step: 1, min: 1, max: 5 },
]
