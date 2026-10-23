import { z } from 'zod'

import {
  addPlanSchema,
  updatePlanSchema,
} from '@/app/tenants/[tenant]/management/plans/_model/plan.schema'

export type AddPlanModel = z.infer<typeof addPlanSchema>
export type UpdatePlanModel = z.infer<typeof updatePlanSchema>
