/** Contracts of /training/preferences - numeric enums, matching the backend contract. */

export enum UnitSystem {
  Metric = 0,
  Imperial = 1,
}

export enum WeekStartDay {
  Saturday = 0,
  Sunday = 1,
  Monday = 2,
}

export enum AppTheme {
  System = 0,
  Light = 1,
  Dark = 2,
}

export enum UiDensity {
  Comfortable = 0,
  Compact = 1,
}

export enum MuscleMapMode {
  Load = 0,
  Recovery = 1,
}

export interface MemberPreferences {
  unitSystem: UnitSystem
  weightIncrement: number
  defaultRestSeconds: number
  autoStartRestTimer: boolean
  showRir: boolean
  weekStartsOn: WeekStartDay
  autoAdvancePlanDay: boolean
  notificationsEnabled: boolean
  pushEnabled: boolean
  coachMessagesEnabled: boolean
  weeklySummaryEnabled: boolean
  streakReminderEnabled: boolean
  gamificationEnabled: boolean
  theme: AppTheme
  density: UiDensity
  defaultMuscleMap: MuscleMapMode
  reduceMotion: boolean
  equipment: string[]
  /** #RRGGBB picked by the member; null follows the gym palette. */
  primaryColor: string | null
  accentColor: string | null
}

/** Mirrors MemberPreferencesResponse.Defaults so the app renders before the GET returns. */
export const DEFAULT_PREFERENCES: MemberPreferences = {
  unitSystem: UnitSystem.Metric,
  weightIncrement: 2.5,
  defaultRestSeconds: 120,
  autoStartRestTimer: true,
  showRir: true,
  weekStartsOn: WeekStartDay.Saturday,
  autoAdvancePlanDay: true,
  notificationsEnabled: true,
  pushEnabled: false,
  coachMessagesEnabled: true,
  weeklySummaryEnabled: true,
  streakReminderEnabled: true,
  gamificationEnabled: true,
  theme: AppTheme.System,
  density: UiDensity.Comfortable,
  defaultMuscleMap: MuscleMapMode.Load,
  reduceMotion: false,
  equipment: [],
  primaryColor: null,
  accentColor: null,
}

export const EQUIPMENT_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'barbell', label: 'هالتر' },
  { code: 'dumbbell', label: 'دمبل' },
  { code: 'machine', label: 'دستگاه' },
  { code: 'cable', label: 'سیم‌کش' },
  { code: 'kettlebell', label: 'کتل‌بل' },
  { code: 'bands', label: 'کش مقاومتی' },
  { code: 'bodyweight', label: 'وزن بدن' },
  { code: 'bench', label: 'نیمکت' },
  { code: 'pull-up-bar', label: 'بارفیکس' },
  { code: 'cardio', label: 'هوازی' },
]

export const UNIT_SYSTEM_LABEL: Record<UnitSystem, string> = {
  [UnitSystem.Metric]: 'متریک (کیلوگرم)',
  [UnitSystem.Imperial]: 'امپریال (پوند)',
}

export const WEEK_START_LABEL: Record<WeekStartDay, string> = {
  [WeekStartDay.Saturday]: 'شنبه',
  [WeekStartDay.Sunday]: 'یکشنبه',
  [WeekStartDay.Monday]: 'دوشنبه',
}

export const THEME_LABEL: Record<AppTheme, string> = {
  [AppTheme.System]: 'هماهنگ با سیستم',
  [AppTheme.Light]: 'روشن',
  [AppTheme.Dark]: 'تیره',
}

export const DENSITY_LABEL: Record<UiDensity, string> = {
  [UiDensity.Comfortable]: 'راحت',
  [UiDensity.Compact]: 'فشرده',
}

export const MUSCLE_MAP_MODE_LABEL: Record<MuscleMapMode, string> = {
  [MuscleMapMode.Load]: 'کارکرد',
  [MuscleMapMode.Recovery]: 'ریکاوری',
}

/** Labels for the numeric enums, shaped for a `<select>` / segmented control. */
export function optionsOf<T extends number>(
  values: Record<number, string>,
): Array<{ value: T; label: string }> {
  return Object.entries(values).map(([value, label]) => ({
    value: Number(value) as T,
    label,
  }))
}
