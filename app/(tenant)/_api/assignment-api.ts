import type {
  AssignmentListItem,
  AssignmentStatusResponse,
  BulkAssignmentResponse,
  CoachAssignmentItem,
  PagedResult,
  PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'
import { createData, readData, updateData } from '@/core/http-service'

const BASE = 'assignment'
const query = (values: Record<string, string | number | undefined | null>) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      params.set(key, String(value))
  })
  return params.toString()
}
export const listMyAssignments = (status?: PlanAssignmentStatus | '') =>
  readData<AssignmentListItem[]>(`${BASE}/mine?${query({ status })}`)
export const listCoachAssignments = (filters: {
  pageNumber?: number
  pageSize?: number
  memberId?: string
  searchString?: string
  sortBy?: string
  sortDirection?: string
  status?: PlanAssignmentStatus | ''
}) =>
  readData<PagedResult<CoachAssignmentItem>>(
    `${BASE}/list?${query({ pageNumber: 1, pageSize: 100, ...filters })}`,
  )
export const bulkAssignPlan = (
  payload: {planId: string, memberIds: string[]; startDate: string },
) =>
  createData<
    { planId: string; memberIds: string[]; startDate: string },
    BulkAssignmentResponse
  >(`${BASE}`, payload)
export const enrollInPlan = (planId: string) =>
  createData<Record<string, never>, AssignmentStatusResponse>(
    `${BASE}/enroll?planId=${encodeURIComponent(planId)}`,
    {},
  )
export const changeAssignmentStatus = (
  assignmentId: string,
  status: PlanAssignmentStatus,
  startDate?: string,
) =>
  updateData<
    { status: PlanAssignmentStatus; startDate?: string },
    AssignmentStatusResponse
  >(`${BASE}/${encodeURIComponent(assignmentId)}/status`, {
    status,
    ...(startDate ? { startDate } : {}),
  })
