import z from 'zod'

import { forgetPassword } from './forget-password-schema'

export type ForgetPasswordModel = z.infer<typeof forgetPassword>
