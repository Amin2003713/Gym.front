import * as z from 'zod'

import { passwordSchema } from '@/utils/password-schema'

export const FirstFormSchema = z.object({
  domain: z
    .string()
    .min(4, {
      message: 'آدرس اختصاصی باید حداقل ۴ حرف داشته باشد.',
    })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: 'برای آدرس گروه فقط حروف انگلیسی، عدد و خط تیره مجاز است.',
    }),
  name: z.string().min(5, {
    message: 'نام گروه ورزشی باید حداقل ۵ حرف داشته باشد.',
  }),
})

export const SecondFormSchema = z.object({
  firstName: z.string().min(3, {
    message: 'این فیلد باید حداقل ۳ کاراکتر داشته باشد',
  }),
  lastName: z.string().min(3, {
    message: 'این فیلد باید حداقل ۳ کاراکتر داشته باشد',
  }),
  phoneNumber: z.string().length(11, {
    message: 'شماره همراه معتبر نیست',
  }),
  email: z
    .string('ایمیل مدیر گروه الزامی است.')
    .min(1, { error: 'ایمیل مدیر گروه الزامی است.' }),
  password: passwordSchema,
  confirmPassword: passwordSchema,
})

export const ThirdFormSchema = z.object({
  phoneNumber: z.string(),
  domain: z.string(), // optional ?
  code: z.string().length(6, 'کد تأیید نامعتبر است'),
})

export const SignupSchema = z
  .object({
    ...FirstFormSchema.shape,
    ...SecondFormSchema.shape,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمزهای عبور یکسان نیستند',
    path: ['confirmPassword'],
  })
