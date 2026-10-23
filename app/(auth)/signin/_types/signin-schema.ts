import * as z from 'zod'

import { passwordSchema } from '@/utils/password-schema'

export const signinSchema = z.object({
  userName: z.string().min(4, { message: 'حداقل باید 4 کاراکتر باشد' }),
  password: passwordSchema,
})
