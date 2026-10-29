import type { HealthConditionEntry, MeasurementEntry } from './health.types'

/**
 * Local persistence for member health data. The backend endpoints for
 * measurements/conditions are not shipped yet, so this store keeps data in
 * the browser (like the demo surfaces elsewhere) and every screen that reads
 * it must label it clearly as saved locally, not on the server.
 */
const MEASUREMENTS_KEY = 'hamowj:health:measurements'
const CONDITIONS_KEY = 'hamowj:health:conditions'

const read = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

const write = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota/private-mode failures are non-fatal; the UI keeps working in-memory.
  }
}

export function listMeasurements(userId: string): MeasurementEntry[] {
  return read<MeasurementEntry & { userId: string }>(MEASUREMENTS_KEY)
    .filter((row) => row.userId === userId)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
}

export function saveMeasurements(userId: string, entries: MeasurementEntry[]) {
  write(
    MEASUREMENTS_KEY,
    read<{ userId: string }>(MEASUREMENTS_KEY).filter((row) => row.userId !== userId).concat(
      entries.map((entry) => ({ ...entry, userId })),
    ),
  )
}

export function listConditions(userId: string): HealthConditionEntry[] {
  return read<HealthConditionEntry & { userId: string }>(CONDITIONS_KEY)
    .filter((row) => row.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function saveConditions(userId: string, entries: HealthConditionEntry[]) {
  write(
    CONDITIONS_KEY,
    read<{ userId: string }>(CONDITIONS_KEY).filter((row) => row.userId !== userId).concat(
      entries.map((entry) => ({ ...entry, userId })),
    ),
  )
}

/** First-vs-latest delta per tracked field, for report summaries. */
export function fieldDelta(
  entries: MeasurementEntry[],
  key: keyof MeasurementEntry,
): { from: number; to: number; diff: number } | null {
  const withValue = entries.filter(
    (entry) => typeof entry[key] === 'number' && entry[key] != null,
  )
  if (withValue.length < 2) return null
  const from = Number(withValue[0][key])
  const to = Number(withValue[withValue.length - 1][key])
  return { from, to, diff: to - from }
}
