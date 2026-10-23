/**
 * Frontend domain contracts for the tenant-scoped gym-group experience.
 * These are UI-facing contracts, not claims about the final .NET DTO names.
 * Map them to the real backend DTOs in features/gym/api when the backend is supplied.
 */

export type Id = string
export type IsoDateTime = string
export type IsoDate = string

export type GymRole = 'Owner' | 'GroupAdmin' | 'BranchManager' | 'Trainer' | 'Member'
export type ExerciseCategory = 'Strength' | 'Cardio' | 'Mobility' | 'Warmup' | 'Other'
export type ExerciseEquipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Bands'
  | 'Other'
export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Abs'
  | 'Quadriceps'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'FullBody'
  | 'Cardio'
export type WorkoutSetKind = 'Working' | 'Warmup' | 'Drop' | 'RestPause'
export type WorkoutStatus = 'Planned' | 'InProgress' | 'Completed' | 'Skipped'
export type MediaKind = 'Image' | 'Gif' | 'AnimatedSvg' | 'Video'

export interface GymGroupSummary {
  id: Id
  name: string
  slug: string
  timezone: string
  defaultLanguage: string
  branchCount: number
  memberCount: number
}

export interface GymBranch {
  id: Id
  groupId: Id
  name: string
  code?: string
  address?: string
  phone?: string
  isHeadquarters: boolean
  isActive: boolean
  createdAt: IsoDateTime
}

export interface GymUser {
  id: Id
  tenantId: Id
  branchIds: Id[]
  displayName: string
  email?: string
  phone?: string
  role: GymRole
  isActive: boolean
  avatarUrl?: string
  createdAt: IsoDateTime
}

export interface TrainerAssignment {
  id: Id
  tenantId: Id
  branchId: Id
  trainerId: Id
  memberId: Id
  startsAt: IsoDate
  endsAt?: IsoDate
  isActive: boolean
}

export interface ExerciseMedia {
  kind: MediaKind
  url: string
  alt?: string
  /** The server may omit media; clients must render an empty placeholder then. */
}

export interface Exercise {
  id: Id
  tenantId?: Id
  name: string
  localizedNames?: Record<string, string>
  description?: string
  instructions?: string[]
  category: ExerciseCategory
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  equipment: ExerciseEquipment[]
  isCustom: boolean
  media?: ExerciseMedia | null
  createdAt?: IsoDateTime
  updatedAt?: IsoDateTime
}

export interface ExerciseFilter {
  query?: string
  category?: ExerciseCategory
  muscles?: MuscleGroup[]
  equipment?: ExerciseEquipment[]
  page: number
  pageSize: number
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  hasMore: boolean
}

export interface PlannedExercise {
  id: Id
  exerciseId: Id
  order: number
  restSeconds?: number
  notes?: string
  supersetGroup?: string
  targetSets: PlannedSet[]
}

export interface PlannedSet {
  id: Id
  order: number
  kind: WorkoutSetKind
  targetReps?: number
  targetWeightKg?: number
  targetDurationSeconds?: number
  targetDistanceMeters?: number
  targetRpe?: number
  targetRir?: number
}

export interface RoutineDay {
  id: Id
  name: string
  weekday?: number
  exercises: PlannedExercise[]
}

export interface Routine {
  id: Id
  tenantId: Id
  ownerUserId: Id
  name: string
  description?: string
  isTemplate: boolean
  isArchived: boolean
  days: RoutineDay[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface WorkoutSetLog {
  id: Id
  plannedSetId?: Id
  order: number
  kind: WorkoutSetKind
  reps?: number
  weightKg?: number
  durationSeconds?: number
  distanceMeters?: number
  rpe?: number
  rir?: number
  completedAt?: IsoDateTime
  isCompleted: boolean
}

export interface WorkoutExerciseLog {
  id: Id
  exerciseId: Id
  order: number
  notes?: string
  supersetGroup?: string
  sets: WorkoutSetLog[]
}

export interface WorkoutSession {
  id: Id
  tenantId: Id
  memberId: Id
  branchId?: Id
  routineId?: Id
  routineDayId?: Id
  title: string
  status: WorkoutStatus
  startedAt: IsoDateTime
  completedAt?: IsoDateTime
  durationSeconds?: number
  notes?: string
  exercises: WorkoutExerciseLog[]
}

export interface BodyMeasurement {
  id: Id
  tenantId: Id
  userId: Id
  measuredAt: IsoDateTime
  weightKg?: number
  bodyFatPercent?: number
  waistCm?: number
  chestCm?: number
  hipsCm?: number
  neckCm?: number
  leftArmCm?: number
  rightArmCm?: number
  leftThighCm?: number
  rightThighCm?: number
  notes?: string
}

export interface PersonalRecord {
  id: Id
  userId: Id
  exerciseId: Id
  achievedAt: IsoDateTime
  weightKg?: number
  reps?: number
  estimatedOneRepMaxKg?: number
  durationSeconds?: number
  distanceMeters?: number
}

export interface GymPreferences {
  language: string
  weekStartsOn: 'Monday' | 'Sunday'
  weightUnit: 'kg' | 'lb'
  distanceUnit: 'km' | 'mi'
  theme: 'system' | 'light' | 'dark'
  restTimerEnabled: boolean
  defaultRestSeconds: number
  showRpe: boolean
  showRir: boolean
}

export interface CreateRoutineRequest {
  name: string
  description?: string
  days: Array<Pick<RoutineDay, 'name' | 'weekday' | 'exercises'>>
}

export interface StartWorkoutRequest {
  routineId?: Id
  routineDayId?: Id
  startedAt?: IsoDateTime
}

export interface CompleteWorkoutRequest {
  completedAt: IsoDateTime
  notes?: string
}

export interface UpsertBodyMeasurementRequest extends Omit<BodyMeasurement, 'id' | 'tenantId' | 'userId'> {}

export interface InviteGymMemberRequest {
  displayName: string
  email?: string
  phone?: string
  role: Exclude<GymRole, 'Owner' | 'GroupAdmin'>
  branchIds: Id[]
  trainerId?: Id
}

export interface ApiErrorResponse {
  code?: string
  message: string
  traceId?: string
  errors?: Record<string, string[]>
}
