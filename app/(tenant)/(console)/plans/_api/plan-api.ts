import { createData, deleteData, readBlob, readData, updateData } from '@/core/http-service'

import type {
  PlanCatalogResponse,
  PlanDayDetail,
  PlanDetail,
  PlanExerciseDetail,
  PlanDurationType,
  PlanGoal,
  PlanLevel,
  PlanSummary,
  PlanWriteRequest,
} from '../_model/plan.types'

const BASE = 'plan'

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

/**
 * The detail endpoint returns `{ plan, days }` where each slot is wrapped with the catalog names it
 * resolved. Screens read one flat shape, so the wrapper is unwrapped here - once, in the API layer.
 */
export const getPlan = async (planId: string): Promise<PlanDetail> => {
  interface NamedSlot extends PlanExerciseDetail {
    slot: PlanExerciseDetail
    exerciseName?: string | null
    bodyPart?: string | null
  }

  const response = await readData<{
    plan: PlanDetail
    days: Array<Omit<PlanDayDetail, 'exercises'> & { exercises: NamedSlot[] }>
  }>(`${BASE}/${encodeURIComponent(planId)}`)

  return {
    ...response.plan,
    days: response.days.map((day) => ({
      ...day,
      exercises: day.exercises.map(({ slot, exerciseName, bodyPart, target }) => ({
        ...slot,
        exerciseName: exerciseName ?? null,
        bodyPart: bodyPart ?? null,
        target: target ?? null,
      })),
    })),
  }
}

export const createPlan = (payload: PlanWriteRequest) =>
  createData<PlanWriteRequest, PlanSummary>(BASE, payload)

export const updatePlan = (planId: string, payload: PlanWriteRequest) =>
  updateData<PlanWriteRequest, PlanDetail>(`${BASE}/${encodeURIComponent(planId)}`, payload)

export const archivePlan = (planId: string) => deleteData(`${BASE}/${encodeURIComponent(planId)}`)

/** Server-rendered PDF (QuestPDF). Downloaded as a blob so the bearer token is sent. */
export const downloadPlanPdf = async (planId: string, title: string) => {
  const blob = await readBlob(`${BASE}/${encodeURIComponent(planId)}/pdf`)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${title || 'plan'}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
