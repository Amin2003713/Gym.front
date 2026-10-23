import { z } from 'zod'

import {
  addDepartmentSchema,
  updateDepartmentSchema,
} from './department.schema'

export type AddDepartmentModel = z.infer<typeof addDepartmentSchema>
export type UpdateDepartmentModel = z.infer<typeof updateDepartmentSchema>
