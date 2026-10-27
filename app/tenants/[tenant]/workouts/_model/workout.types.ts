export type WorkoutSessionType = 'Planned' | 'Free'
export type WorkoutSessionStatus = 'InProgress' | 'Completed' | 'Abandoned'
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
  status: WorkoutSessionStatus
  type?: WorkoutSessionType
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
  type?: WorkoutSessionType
  status?: WorkoutSessionStatus
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
