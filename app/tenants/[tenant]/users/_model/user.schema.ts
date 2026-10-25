import { z } from 'zod'

/** Matches Application.Users.Commands.Create.CreateUserRequest. */
export const userSchema = z.object({
  firstName: z.string().trim().min(1, 'نام الزامی است.'),
  lastName: z.string().trim().min(1, 'نام خانوادگی الزامی است.'),
  email: z.email('ایمیل معتبر وارد کنید.'),
  phoneNumber: z.string().trim().optional().nullable(),
  phoneCountryCode: z.string().trim().default('+49'),
  avatar: z.string().trim().optional().nullable(),
  gender: z.union([z.number().int().min(0).max(1), z.null()]).optional(),
  role: z.enum(['Admin', 'Tranner', 'Trainee']),
  jobTitle: z.string().trim().optional().nullable(),
  password: z.string().optional().nullable(),
  confirmPassword: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.password && data.password !== data.confirmPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'تکرار رمز عبور مطابقت ندارد.' })
  }
})

export const updateUserSchema = userSchema.extend({ id: z.string().uuid() })

// Retained only for older imports; the supplied API has no SIM-serial endpoint.
export const updateUserSimSerialSchema = z.object({ userId: z.string(), simSerial: z.string().optional() })
