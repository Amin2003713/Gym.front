// The API contract is numeric end-to-end: the frontend sends numbers and the
// backend returns numbers. Enums below mirror the C# declarations.
export enum WorkoutSessionType {
  Planned =1,
  Free = 2,
}

export enum WorkoutSessionStatus {
  InProgress = 1,
  Completed = 2,
  Abandoned = 3,
}

/** Accepts numeric enum members (or legacy string names) from the API and normalizes. */
export function normalizeSessionType(value: unknown): WorkoutSessionType | null {
  if (value === WorkoutSessionType.Planned || value === 'Planned' || value === '1') return WorkoutSessionType.Planned
  if (value === WorkoutSessionType.Free || value === 'Free' || value === '2') return WorkoutSessionType.Free
  return null
}
export function normalizeSessionStatus(value: unknown): WorkoutSessionStatus | null {
  if (value === WorkoutSessionStatus.InProgress || value === 'InProgress' || value === '1') return WorkoutSessionStatus.InProgress
  if (value === WorkoutSessionStatus.Completed || value === 'Completed' || value === '2') return WorkoutSessionStatus.Completed
  if (value === WorkoutSessionStatus.Abandoned || value === 'Abandoned' || value === '3') return WorkoutSessionStatus.Abandoned
  return null
}

export interface LoggedSetItem {
  setId: string
  setNumber: number
  reps: number
  weightKg: number
  rir?: number | null
  rpe?: number | null
  isWarmup: boolean
  completedAt?: string | null
}
export interface SessionExerciseItem {
  planDayExerciseId?: string | null
  exerciseId: string
  exerciseName?: string | null
  category?: string | null
  equipment?: string | null
  bodyPart?: string | null
  target?: string | null
  exerciseOrder: number
  isPlanned: boolean
  isExtra: boolean
  targetSets?: number | null
  targetRepsMin?: number | null
  targetRepsMax?: number | null
  targetRir?: number | null
  notes?: string | null
  supersetGroup?: string | null
  sets: LoggedSetItem[]
  lastPerformance?: unknown
  suggestion?: { suggestedWeightKg?: number; suggestedReps?: number; reason?: string; confidence?: string; source?: string } | null
}
export interface SessionResponse {
  id: string
  sessionId?: string
  status: WorkoutSessionStatus | string
  type?: WorkoutSessionType | string
  title?: string | null
  startedAt?: string
  completedAt?: string | null
  exercises: SessionExerciseItem[]
  [key: string]: unknown
}
export interface StartSessionResponse {
  sessionId?: string
  id?: string
  resumed?: boolean
  [key: string]: unknown
}
export interface WorkoutListItem {
  id: string
  sessionId?: string
  type?: WorkoutSessionType | string
  status?: WorkoutSessionStatus | string
  title?: string | null
  startedAt?: string
  completedAt?: string | null
  totalVolumeKg?: number
  totalSets?: number
  distinctExercises?: number
  [key: string]: unknown
}
export interface ExerciseSearchItem {
  id: string
  name: string
  category?: string | null
  bodyPart?: string | null
  target?: string | null
  equipment?: string | null
  level?: string | null
  lastPerformedAt?: string | null
}
export interface ExerciseSearchResponse { items: ExerciseSearchItem[]; page: number; pageSize: number; total: number }
export interface RecentExerciseItem { exerciseId: string; name?: string; category?: string; equipment?: string; lastPerformedAt?: string; timesPerformed?: number }
export interface CompleteSessionResponse {
  sessionId: string
  totalVolumeKg: number
  totalSets: number
  distinctExercises: number
  durationMinutes: number
  newPrs: Array<{ exerciseId: string; exerciseName?: string; weightKg: number; e1Rm: number }>
  completedSessions?: number
  totalSessions?: number
  assignmentCompleted?: boolean
}
export interface HistoryResponse {
  items: Array<{ id: string; setNumber: number; reps: number; weightKg: number; rir?: number | null; isWarmup: boolean; completedAt: string; e1Rm?: number; isBest?: boolean }>
  bestSet?: unknown
  nextCursor?: string | null
}
