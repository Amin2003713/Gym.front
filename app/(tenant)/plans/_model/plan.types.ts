export type PlanVisibility = 'Private' | 'Public'
export type PlanDurationType = 'Sessions' | 'Weeks'
export type PlanGoal = 'GetStronger' | 'BuildMuscle' | 'LoseWeight' | 'Endurance' | 'Fitness' | 'Mobility'
export type PlanLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface PlanExerciseInput {
  exerciseId: string
  orderIndex: number
  targetSets?: number | null
  targetRepsMin?: number | null
  targetRepsMax?: number | null
  targetRir?: number | null
  restSeconds?: number | null
  notes?: string | null
  supersetGroup?: string | null
}
export interface PlanDayInput {
  name: string
  exercises: PlanExerciseInput[]
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
export interface PlanExerciseDetail extends PlanExerciseInput {
  id: string
  restSeconds: number
  exerciseName?: string | null
}
export interface PlanDayDetail {
  dayNumber: number
  name: string
  exercises: PlanExerciseDetail[]
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
