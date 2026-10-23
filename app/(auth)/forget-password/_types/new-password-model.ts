import z from 'zod'

import { newPasswordSchema } from './new-password-schema'

export type NewPasswordModel = z.infer<typeof newPasswordSchema>
