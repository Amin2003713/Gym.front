/**
 * Common muscle groups shown in the plan-day target picker. The individual slugs still travel to
 * the API; a group is only a shortcut that selects the muscles it contains, so a coach does not
 * have to scan all eighteen body-map chips for every day.
 */
export const MUSCLE_GROUPS = [
  {
    code: 'chest-back',
    label: 'سینه و پشت',
    muscles: ['chest', 'upper-back', 'lower-back', 'serratus', 'trapezius'],
  },
  {
    code: 'shoulders-arms',
    label: 'شانه و بازو',
    muscles: ['deltoids', 'biceps', 'triceps', 'forearm'],
  },
  {
    code: 'legs',
    label: 'پا و سرینی',
    muscles: ['gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors', 'calves', 'tibialis'],
  },
  {
    code: 'core',
    label: 'مرکز بدن',
    muscles: ['abs', 'obliques'],
  },
] as const

export type MuscleGroupCode = (typeof MUSCLE_GROUPS)[number]['code']

/** The group a slug belongs to, for showing the current selection in words. */
export const MUSCLE_GROUP_OF: Record<string, MuscleGroupCode> = Object.fromEntries(
  MUSCLE_GROUPS.flatMap((group) => group.muscles.map((muscle) => [muscle, group.code])),
) as Record<string, MuscleGroupCode>
