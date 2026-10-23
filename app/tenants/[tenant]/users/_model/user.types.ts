import { z } from 'zod'

import {
  updateUserSchema,
  updateUserSimSerialSchema,
  userSchema,
} from '@/app/tenants/[tenant]/users/_model/user.schema'

type AddUserModel = z.infer<typeof userSchema>
type UpdateUserModel = z.infer<typeof updateUserSchema>
type UpdateUserSimSerialModel = z.infer<typeof updateUserSimSerialSchema>

export {
  type AddUserModel,
  type UpdateUserModel,
  type UpdateUserSimSerialModel,
}
