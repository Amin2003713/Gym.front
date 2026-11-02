import { listPublicPlans } from '@/app/(tenant)/(console)/plans/_api/plan-api'
import type {
  PlanCatalogResponse,
  PlanSummary,
} from '@/app/(tenant)/(console)/plans/_model/plan.types'

export { getPlan } from '@/app/(tenant)/(console)/plans/_api/plan-api'
export { enrollInPlan } from './assignment-api'

export type { PlanSummary } from '@/app/(tenant)/(console)/plans/_model/plan.types'

/** The catalog endpoint answers either a keyset page or a plain list depending on the build. */
export async function listPublicPlanCatalog(pageSize = 20): Promise<PlanSummary[]> {
  const response = await listPublicPlans({ pageSize })
  const page = response as PlanCatalogResponse | PlanSummary[]

  return Array.isArray(page) ? page : (page.items ?? page.results ?? [])
}
