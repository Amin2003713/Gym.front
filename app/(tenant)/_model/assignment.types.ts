export enum PlanAssignmentStatus {
  Active = 0,
  Paused = 1,
  Completed = 2,
  Cancelled = 3,
}

export enum PlanAssignmentSource {
  CoachAssigned = 0,
  SelfPicked = 1,
  SelfCreated = 2,
}

export enum PlanDurationType {
  Sessions = 0,
  Weeks = 1,
}
export interface AssignmentStatusResponse {
  id: string
  status: PlanAssignmentStatus
  completedSessions: number
  totalSessions: number
  startDate: string
  endDate?: string | null
}
export interface CoachAssignmentItem extends AssignmentStatusResponse {
  assignmentId?: string
  memberId?: string
  member?: { userId: string; firstName?: string | null; lastName?: string | null; email?: string | null; avatar?: string | null }
  planId?: string
  planTitle?: string | null
  plan?: AssignmentPlan
  source?: PlanAssignmentSource
}
export interface PagedResult<T> {
  results: T[]
  currentPage: number
  pageCount: number
  pageSize: number
  rowCount: number
}
export interface BulkAssignmentResponse {
  planId: string
  planVersionId: string
  startDate: string
  endDate?: string | null
  members: Array<{ memberId: string; assignmentId?: string; status?: string; error?: string | null }>
}
export interface AssignmentListItem extends AssignmentStatusResponse {
  planId?: string
  planTitle?: string | null
  source?: PlanAssignmentSource
  planDayId?: string | null
  /**
   * The assigned version's tree, embedded by AssignmentListItemResponse. `plan.plan` is the
   * PlanFullResponse header and `plan.days` the named day tree; `planId`/`planTitle` above are
   * legacy flat fields kept for the console screens.
   */
  plan?: AssignmentPlan
}

export interface AssignmentPlan {
  plan: {
    id: string
    title: string
    description?: string | null
    durationType?: PlanDurationType
    totalSessions?: number | null
    durationWeeks?: number | null
  }
  days: AssignmentPlanDay[]
}

export interface AssignmentPlanDay {
  /** Plan day id; the session runner accepts it to start this exact day. */
  id: string
  dayNumber: number
  name: string
  exercises: AssignmentPlanExercise[]
}

export interface AssignmentPlanExercise {
  slot: {
    id: string
    exerciseId: string
    orderIndex: number
    targetSets: number
    targetRepsMin: number | null
    targetRepsMax: number | null
    targetRir: number | null
    restSeconds: number
    notes: string | null
    supersetGroup: number | null
    minWeightKg?: number | null
    maxWeightKg?: number | null
    exerciseType?: number
    targetDurationSeconds?: number | null
    /** 0 = main, 1 = warm-up, 2 = cool-down. */
    phase?: number
  }
  exerciseName?: string | null
  bodyPart?: string | null
  target?: string | null
}
