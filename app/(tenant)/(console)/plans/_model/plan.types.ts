/**
 * Plan enums mirror Domain.Plans.Enums. They travel over the wire - and are stored in the database -
 * as their integer value, so the API, the schema and every screen agree on one representation.
 */
export const PlanVisibility = { Private: 0, Public: 1 } as const
export type PlanVisibility = (typeof PlanVisibility)[keyof typeof PlanVisibility]

export const PlanDurationType = { Sessions: 0, Weeks: 1 } as const
export type PlanDurationType = (typeof PlanDurationType)[keyof typeof PlanDurationType]

export const PlanGoal = {
  GetStronger: 0,
  BuildMuscle: 1,
  LoseWeight: 2,
  Endurance: 3,
  Fitness: 4,
  Mobility: 5,
} as const
export type PlanGoal = (typeof PlanGoal)[keyof typeof PlanGoal]

export const PlanLevel = { Beginner: 0, Intermediate: 1, Advanced: 2 } as const
export type PlanLevel = (typeof PlanLevel)[keyof typeof PlanLevel]

/** Mirrors Domain.Plans.Enums.PlanExerciseType. */
export const PlanExerciseType = { Standard: 0, Timed: 1, Superset: 2 } as const
export type PlanExerciseType = (typeof PlanExerciseType)[keyof typeof PlanExerciseType]

export interface PlanExerciseInput {
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetRepsMin?: number | null
  targetRepsMax?: number | null
  targetRir?: number | null
  restSeconds: number
  notes?: string | null
  supersetGroup?: number | null
  exerciseType: PlanExerciseType
  targetDurationSeconds?: number | null
}
export interface PlanDayInput {
  name: string
  exercises: PlanExerciseInput[]
  /** Body-map slugs the day is planned around; drives the exercise finder and its map. */
  targetMuscleCodes: string[]
}
export interface PlanWriteRequest {
  title: string
  description?: string | null
  visibility: PlanVisibility
  durationType: PlanDurationType
  totalSessions?: number | null
  durationWeeks?: number | null
  goal: PlanGoal
  level: PlanLevel
  days: PlanDayInput[]
  /** Required for a private plan by the server's domain rule. */
  assignedMemberUserId?: string | null
}
export interface PlanSummary {
  id: string
  title: string
  visibility: PlanVisibility
  durationType: PlanDurationType
  totalSessions?: number | null
  durationWeeks?: number | null
  goal: PlanGoal
  level: PlanLevel
  isArchived: boolean
  currentVersion: number
  activeAssignmentCount: number
  createdAt: string
}
export interface PlanExerciseDetail {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetRepsMin?: number | null
  targetRepsMax?: number | null
  targetRir?: number | null
  restSeconds: number
  notes?: string | null
  supersetGroup?: number | null
  exerciseType?: PlanExerciseType
  targetDurationSeconds?: number | null
  exerciseName?: string | null
  bodyPart?: string | null
  target?: string | null
}
export interface PlanDayDetail {
  id: string
  dayNumber: number
  name: string
  exercises: PlanExerciseDetail[]
  targetMuscleCodes?: string[] | null
}
export interface PlanDetail extends Omit<PlanSummary, 'activeAssignmentCount'> {
  ownerUserId: string
  description?: string | null
  days: PlanDayDetail[]
}
export interface PlanCatalogResponse {
  items?: PlanSummary[]
  results?: PlanSummary[]
  nextCursor?: string | null
}
export interface ApiProblemDetails {
  status?: number
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}
