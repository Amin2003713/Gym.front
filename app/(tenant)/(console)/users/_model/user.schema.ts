import { z } from 'zod'

import { ApiUserRole } from '@/features/users/api/users-api'

/** Matches Application.Users.Commands.Create.CreateUserRequest. */
export const userSchema = z.object({
  firstName: z.string().trim().min(1, 'نام الزامی است.'),
  lastName: z.string().trim().min(1, 'نام خانوادگی الزامی است.'),
  email: z.email('ایمیل معتبر وارد کنید.'),
  /** Phone number doubles as the login username; no country-code prefix. */
  phoneNumber: z
    .string()
    .trim()
    .regex(/^0\d{10}$/, 'شماره همراه باید ۱۱ رقم و با ۰ شروع شود.'),
  avatar: z.string().trim().optional().nullable(),
  gender: z.union([z.number().int().min(0).max(1), z.null()]).optional(),
  // Backend expects integer role values (C# Roles enum).
  role: z.nativeEnum(ApiUserRole),
  password: z.string().optional().nullable(),
  confirmPassword: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.password && data.password !== data.confirmPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'تکرار رمز عبور مطابقت ندارد.' })
  }
})

export const updateUserSchema = userSchema.safeExtend({
  id: z.string().uuid(),
})
// Retained only for older imports; the supplied API has no SIM-serial endpoint.
export const updateUserSimSerialSchema = z.object({ userId: z.string(), simSerial: z.string().optional() })
