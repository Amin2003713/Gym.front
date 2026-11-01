export type PlanVisibility = 'Private' | 'Public'
export type PlanDurationType = 'Sessions' | 'Weeks'
export type PlanGoal = 'GetStronger' | 'BuildMuscle' | 'LoseWeight' | 'Endurance' | 'Fitness' | 'Mobility'
export type PlanLevel = 'Beginner' | 'Intermediate' | 'Advanced'
/** Mirrors Domain.Plans.Enums.PlanExerciseType. */
export type PlanExerciseType = 'Standard' | 'Timed' | 'Superset'

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
