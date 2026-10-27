import { createData, deleteData, readData, updateData } from '@/core/http-service'
import type { PlanCatalogResponse, PlanDetail, PlanSummary, PlanWriteRequest, PlanGoal, PlanLevel, PlanDurationType } from '../_model/plan.types'

const BASE = '/api/plan'
const query = (values: Record<string, string | number | undefined | null>) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  return params.toString()
}

export const listMyPlans = (page = 1, pageSize = 20) =>
  readData<PlanSummary[]>(`${BASE}/mine?${query({ page, pageSize })}`)

export const listPublicPlans = (filters: {
  goal?: PlanGoal | ''
  level?: PlanLevel | ''
  durationType?: PlanDurationType | ''
  durationValue?: number | ''
  cursor?: string | null
  pageSize?: number
}) => readData<PlanCatalogResponse | PlanSummary[]>(`${BASE}/public?${query(filters)}`)

export const getPlan = (planId: string) => readData<PlanDetail>(`${BASE}/${encodeURIComponent(planId)}`)
export const createPlan = (payload: PlanWriteRequest) => createData<PlanWriteRequest, PlanSummary>(BASE, payload)
export const updatePlan = (planId: string, payload: PlanWriteRequest) =>
  updateData<PlanWriteRequest, PlanDetail>(`${BASE}/${encodeURIComponent(planId)}`, payload)
export const archivePlan = (planId: string) => deleteData(`${BASE}/${encodeURIComponent(planId)}`)
