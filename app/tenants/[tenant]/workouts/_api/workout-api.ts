import {
  createData,
  deleteData,
  readData,
  updateData,
} from '@/core/http-service'

import type {
  CompleteSessionResponse,
  ExerciseSearchResponse,
  HistoryResponse,
  RecentExerciseItem,
  SessionResponse,
  StartSessionResponse,
  WorkoutListItem,
  WorkoutSessionType,
} from '../_model/workout.types'



const BASE = 'workout'

const query = (values: Record<string, string | number | undefined | null>) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      params.set(key, String(value))
  })
  return params.toString()
}
export type StartWorkoutRequest = {
  mode: 'planned' | 'free'
  assignmentId: string | null
  planDayId: string | null
  title?: string | null
}

export const startWorkout = (payload: StartWorkoutRequest) =>
  createData<StartWorkoutRequest, StartSessionResponse>(BASE, payload)
export const getWorkout = (sessionId: string) =>
  readData<SessionResponse>(`${BASE}/${encodeURIComponent(sessionId)}`)
// type/status are numeric enum values both ways (see workout.types.ts).
export const listMyWorkouts = (
  type?: WorkoutSessionType | '',
  cursor?: string | null,
  pageSize = 20,
  memberId?: string | null,
) =>
  readData<
    | {
        items?: WorkoutListItem[]
        results?: WorkoutListItem[]
        nextCursor?: string | null
      }
    | WorkoutListItem[]
  >(`${BASE}/mine?${query({ type, cursor, pageSize, memberId })}`)
export const addWorkoutExercise = (
  sessionId: string,
  payload: {
    exerciseId: string
    targetSets?: number
    targetRepsMin?: number
    targetRepsMax?: number
    targetRir?: number
  },
) =>
  createData<typeof payload, { exercise: unknown }>(
    `${BASE}/${encodeURIComponent(sessionId)}/exercises`,
    payload,
  )
export const removeWorkoutExercise = (sessionId: string, exerciseId: string) =>
  deleteData(
    `${BASE}/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseId)}`,
  )
export const logWorkoutSets = (
  sessionId: string,
  payload: {
    sets: Array<{
      exerciseId: string
      planDayExerciseId?: string
      setNumber: number
      reps: number
      weightKg: number
      rir?: number
      rpe?: number
      isWarmup: boolean
      clientRequestId: string
    }>
  },
) =>
  createData<
    typeof payload,
    { results: Array<{ clientRequestId?: string; setId: string }> }
  >(`${BASE}/${encodeURIComponent(sessionId)}/sets`, payload)
export const completeWorkout = (sessionId: string) =>
  createData<Record<string, never>, CompleteSessionResponse>(
    `${BASE}/${encodeURIComponent(sessionId)}/complete`,
    {},
  )
export const abandonWorkout = (sessionId: string) =>
  createData<Record<string, never>, void>(
    `${BASE}/${encodeURIComponent(sessionId)}/abandon`,
    {},
  )
export const updateLoggedSet = (
  setId: string,
  payload: {
    reps: number
    weightKg: number
    rir?: number
    rpe?: number
    isWarmup: boolean
  },
) =>
  updateData<typeof payload, unknown>(
    `${BASE}/sets/${encodeURIComponent(setId)}`,
    payload,
  )
export const deleteLoggedSet = (setId: string) =>
  deleteData(`${BASE}/sets/${encodeURIComponent(setId)}`)
export const listRecentExercises = () =>
  readData<RecentExerciseItem[]>(`${BASE}/exercises/recent`)
export const searchExercises = (filters: {
  query: string
  muscle?: string
  equipment?: string
  page?: number
  pageSize?: number
}) =>
  readData<ExerciseSearchResponse>(
    `${BASE}/exercises/search?${query({ page: 1, pageSize: 20, ...filters })}`,
  )
export const getExerciseHistory = (
  exerciseId: string,
  cursor?: string | null,
  pageSize = 20,
) =>
  readData<HistoryResponse>(
    `${BASE}/exercises/${encodeURIComponent(exerciseId)}/history?${query({ cursor, pageSize })}`,
  )
export const getExerciseSuggestion = (exerciseId: string) =>
  readData<{
    suggestedWeightKg?: number
    suggestedReps?: number
    reason?: string
    confidence?: string
    source?: string
  }>(`${BASE}/exercises/${encodeURIComponent(exerciseId)}/suggestion`)
export interface NextSessionResponse {
  assignmentId?: string
  planId?: string
  planTitle?: string
  planDayId?: string
  dayNumber?: number
  dayName?: string
  exercises?: Array<{
    exerciseId: string
    exerciseName?: string
    targetSets?: number
    targetRepsMin?: number
    targetRepsMax?: number
    targetRir?: number
  }>
  [key: string]: unknown
}

export const getNextSession = (assignmentId: string) =>
  readData<NextSessionResponse>(
    `${BASE}/assignments/${encodeURIComponent(assignmentId)}/next-session`,
  )
