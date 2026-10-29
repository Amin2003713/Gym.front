/** Measurements a member tracks over time (mirrors BodyMeasurement semantics). */
export interface MeasurementEntry {
  id: string
  measuredAt: string // ISO date
  weightKg?: number | null
  bodyFatPercent?: number | null
  waistCm?: number | null
  chestCm?: number | null
  hipsCm?: number | null
  neckCm?: number | null
  leftArmCm?: number | null
  rightArmCm?: number | null
  leftThighCm?: number | null
  rightThighCm?: number | null
  notes?: string | null
}

export type HealthConditionKind = 'condition' | 'disability' | 'injury' | 'allergy'

export interface HealthConditionEntry {
  id: string
  kind: HealthConditionKind
  title: string
  severity: 'mild' | 'moderate' | 'severe'
  notes?: string | null
  createdAt: string
}

export const CONDITION_TYPE_LABELS: Record<HealthConditionKind, string> = {
  condition: 'بیماری / وضعیت پزشکی',
  disability: 'محدودیت جسمی',
  injury: 'آسیب / منع تمرین',
  allergy: 'حساسیت',
}

export const SEVERITY_LABELS: Record<HealthConditionEntry['severity'], string> = {
  mild: 'خفیف',
  moderate: 'متوسط',
  severe: 'شدید',
}

export interface MeasurementField {
  key: Exclude<keyof MeasurementEntry, 'id' | 'measuredAt' | 'notes'>
  label: string
  unit: string
}

export const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: 'weightKg', label: 'وزن', unit: 'kg' },
  { key: 'bodyFatPercent', label: 'درصد چربی', unit: '٪' },
  { key: 'waistCm', label: 'دور کمر', unit: 'cm' },
  { key: 'chestCm', label: 'دور سینه', unit: 'cm' },
  { key: 'hipsCm', label: 'دور باسن', unit: 'cm' },
  { key: 'neckCm', label: 'دور گردن', unit: 'cm' },
  { key: 'leftArmCm', label: 'بازوی چپ', unit: 'cm' },
  { key: 'rightArmCm', label: 'بازوی راست', unit: 'cm' },
  { key: 'leftThighCm', label: 'ران چپ', unit: 'cm' },
  { key: 'rightThighCm', label: 'ران راست', unit: 'cm' },
]
