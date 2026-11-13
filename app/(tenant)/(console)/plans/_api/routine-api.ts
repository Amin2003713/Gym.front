import type { Routine, RoutineDay } from '@/features/gym/domain/types'

// Mock API - in production this would call the .NET backend
// These are placeholder implementations that should be replaced with real API calls

export async function listRoutines(): Promise<Routine[]> {
  // TODO: Replace with real API call to /api/gym/routines or similar
  // For now, return empty array - the UI should handle this gracefully
  console.log('listRoutines called')
  return []
}

export interface CreateRoutineRequest {
  name: string
  description?: string
  isTemplate: boolean
  days: Array<{
    name: string
    weekday?: number
    exercises: Array<{
      exerciseId: string
      order: number
      restSeconds?: number
      notes?: string
      supersetGroup?: string
      targetSets: Array<{
        kind: 'Working' | 'Warmup' | 'Drop' | 'RestPause'
        targetReps?: number
        targetWeightKg?: number
        targetDurationSeconds?: number
        targetDistanceMeters?: number
        targetRpe?: number
        targetRir?: number
      }>
    }>
  }>
}

export async function createRoutine(request: CreateRoutineRequest): Promise<Routine> {
  // TODO: Replace with real API call
  // For now, simulate success
  console.log('createRoutine called with:', request)
  
  const routine: Routine = {
    id: crypto.randomUUID(),
    tenantId: '',
    ownerUserId: '',
    name: request.name,
    description: request.description,
    isTemplate: request.isTemplate,
    isArchived: false,
    days: request.days.map((day, i) => ({
      id: crypto.randomUUID(),
      name: day.name,
      weekday: day.weekday,
      exercises: day.exercises.map((ex, j) => ({
        id: crypto.randomUUID(),
        exerciseId: ex.exerciseId,
        order: ex.order,
        restSeconds: ex.restSeconds,
        notes: ex.notes,
        supersetGroup: ex.supersetGroup,
        targetSets: ex.targetSets.map((set, k) => ({
          id: crypto.randomUUID(),
          order: k,
          kind: set.kind,
          targetReps: set.targetReps,
          targetWeightKg: set.targetWeightKg,
          targetDurationSeconds: set.targetDurationSeconds,
          targetDistanceMeters: set.targetDistanceMeters,
          targetRpe: set.targetRpe,
          targetRir: set.targetRir,
        })),
      })),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  return routine
}