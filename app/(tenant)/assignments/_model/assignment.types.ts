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
  memberId: string
  memberName?: string | null
  memberEmail?: string | null
  planId?: string
  planTitle?: string | null
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
}
