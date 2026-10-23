import z from 'zod'

import { passwordSchema } from '@/utils/password-schema'

export const newPasswordSchema = z
  .object({
    code: z.string().length(6, 'کد تایید نامعتبر'),
    userName: z.string().length(11, { message: 'حداقل باید 11 کاراکتر باشد' }),
    confirmPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .refine((data) => data.confirmPassword === data.newPassword, {
    message: 'یکسان نمیباشد !!',
    path: ['confirmPassword'],
  })
