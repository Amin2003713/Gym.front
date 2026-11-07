import { readData, updateData } from '@/core/http-service'

import {
  AppTheme,
  MuscleMapMode,
  UnitSystem,
  UiDensity,
  WeekStartDay,
  type MemberPreferences,
} from '../_model/preferences'

const route = 'training/preferences'

/**
 * The contract is numeric, but a proxy or serializer change has shipped enum names before. One
 * normalized shape keeps the settings panels and the theme sync from reading `undefined`.
 */
const asEnum = <T extends number>(value: unknown, fallback: T): T => {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? (parsed as T) : fallback
}

const normalize = (value: MemberPreferences): MemberPreferences => ({
  ...value,
  unitSystem: asEnum(value.unitSystem, UnitSystem.Metric),
  weekStartsOn: asEnum(value.weekStartsOn, WeekStartDay.Saturday),
  theme: asEnum(value.theme, AppTheme.System),
  density: asEnum(value.density, UiDensity.Comfortable),
  defaultMuscleMap: asEnum(value.defaultMuscleMap, MuscleMapMode.Load),
  equipment: Array.isArray(value.equipment) ? value.equipment : [],
})

export const getPreferences = async () => normalize(await readData<MemberPreferences>(route))

export const savePreferences = async (preferences: MemberPreferences) =>
  normalize(await updateData<MemberPreferences, MemberPreferences>(route, preferences))
