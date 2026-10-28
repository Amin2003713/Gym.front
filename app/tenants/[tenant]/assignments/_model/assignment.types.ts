export type PlanAssignmentStatus = 'Active' | 'Paused' | 'Completed' | 'Cancelled'
export type PlanAssignmentSource = 'CoachAssigned' | 'SelfPicked' | 'SelfCreated'
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
