import type {
  BodyMeasurement,
  CompleteWorkoutRequest,
  CreateRoutineRequest,
  Exercise,
  ExerciseFilter,
  GymBranch,
  GymGroupSummary,
  GymPreferences,
  GymUser,
  Id,
  InviteGymMemberRequest,
  PageResult,
  PersonalRecord,
  Routine,
  StartWorkoutRequest,
  TrainerAssignment,
  UpsertBodyMeasurementRequest,
  WorkoutSession,
} from '../domain/types'

/**
 * The frontend depends on this contract only. Implementations should map these
 * operations to the real .NET routes once that backend repository is provided.
 * Tenant identity is derived from the authenticated tenant context, not trusted
 * from arbitrary client-supplied IDs.
 */
export interface GymApi {
  getGroupSummary(): Promise<GymGroupSummary>
  listBranches(): Promise<GymBranch[]>
  listMembers(query?: { branchId?: Id; role?: GymUser['role']; search?: string; page?: number; pageSize?: number }): Promise<PageResult<GymUser>>
  inviteMember(request: InviteGymMemberRequest): Promise<{ invitationId: Id; expiresAt: string }>
  listTrainerAssignments(query?: { trainerId?: Id; memberId?: Id }): Promise<TrainerAssignment[]>
  listExercises(filter: ExerciseFilter): Promise<PageResult<Exercise>>
  getExercise(id: Id): Promise<Exercise>
  createExercise(exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise>
  updateExercise(id: Id, exercise: Partial<Exercise>): Promise<Exercise>
  deleteExercise(id: Id): Promise<void>
  listRoutines(query?: { search?: string; includeArchived?: boolean; page?: number; pageSize?: number }): Promise<PageResult<Routine>>
  getRoutine(id: Id): Promise<Routine>
  createRoutine(request: CreateRoutineRequest): Promise<Routine>
  updateRoutine(id: Id, request: Partial<CreateRoutineRequest>): Promise<Routine>
  archiveRoutine(id: Id): Promise<void>
  startWorkout(request: StartWorkoutRequest): Promise<WorkoutSession>
  getWorkout(id: Id): Promise<WorkoutSession>
  listWorkoutHistory(query?: { memberId?: Id; branchId?: Id; from?: string; to?: string; page?: number; pageSize?: number }): Promise<PageResult<WorkoutSession>>
  completeWorkout(id: Id, request: CompleteWorkoutRequest): Promise<WorkoutSession>
  listBodyMeasurements(query?: { userId?: Id; from?: string; to?: string }): Promise<BodyMeasurement[]>
  upsertBodyMeasurement(request: UpsertBodyMeasurementRequest): Promise<BodyMeasurement>
  listPersonalRecords(query?: { userId?: Id; exerciseId?: Id }): Promise<PersonalRecord[]>
  getPreferences(): Promise<GymPreferences>
  updatePreferences(preferences: Partial<GymPreferences>): Promise<GymPreferences>
  exportMyData(): Promise<Blob>
  importWorkoutHistory(file: File): Promise<{ importedCount: number; skippedCount: number; errors: string[] }>
}

export class GymApiNotConfiguredError extends Error {
  constructor() {
    super('The gym API adapter has not been connected to the .NET backend yet.')
    this.name = 'GymApiNotConfiguredError'
  }
}

/** Deliberately no fake data and no guessed HTTP routes in this phase. */
export const gymApi: GymApi = new Proxy({} as GymApi, {
  get(_target, property) {
    if (property === 'then') return undefined
    return async () => {
      throw new GymApiNotConfiguredError()
    }
  },
})
