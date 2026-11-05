/** Persian labels for the canonical tool groups the API groups the stored values into. */
export const EQUIPMENT_LABEL: Record<string, string> = {
  machine: 'دستگاه',
  barbell: 'هالتر',
  dumbbell: 'دمبل',
  cable: 'کابل',
  bodyweight: 'وزن بدن',
  kettlebell: 'کتل‌بل',
  band: 'کش مقاومتی',
  ball: 'توپ تعادلی',
  other: 'سایر',
}

/** Falls back to the raw data value so a new tool added in the catalog still has a label. */
export const equipmentLabel = (code?: string | null, fallback?: string | null) =>
  (code ? EQUIPMENT_LABEL[code] : undefined) ?? fallback ?? code ?? ''

/** Persian labels for the catalog's body-part (muscle group) values. */
export const BODY_PART_LABEL: Record<string, string> = {
  chest: 'سینه',
  back: 'پشت',
  'upper back': 'پشت فوقانی',
  'lower back': 'کمر',
  shoulders: 'سرشانه',
  'upper arms': 'بازو',
  'lower arms': 'ساعد',
  'upper legs': 'ران',
  'lower legs': 'ساق',
  waist: 'شکم',
  neck: 'گردن',
  cardio: 'هوازی',
}

export const bodyPartLabel = (code?: string | null, fallback?: string | null) =>
  (code ? BODY_PART_LABEL[code] : undefined) ?? fallback ?? code ?? ''

/** Persian labels for the catalog's difficulty values. */
export const LEVEL_LABEL: Record<string, string> = {
  beginner: 'مبتدی',
  intermediate: 'متوسط',
  expert: 'حرفه‌ای',
}

export const levelLabel = (code?: string | null, fallback?: string | null) =>
  (code ? LEVEL_LABEL[code] : undefined) ?? fallback ?? code ?? ''

/** Pseudo group the API understands for exercises whose equipment was never filled in. */
export const MISSING_EQUIPMENT = '__missing'
