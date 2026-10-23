import { z } from 'zod'

import { GenderEnum } from '@/enums/gender.enum'
import { UserRoleEnum } from '@/enums/user-role.enum'
import { phoneNumberSchema } from '@/utils/phoneNumber-schema'

export const userSchema = z.object({
  firstName: z
    .string('نام اجباری می باشد.')
    .min(1, { error: 'نام اجباری می باشد.' }),
  lastName: z
    .string('نام خانوادگی اجباری می باشد.')
    .min(1, { error: 'نام خانوادگی اجباری می باشد.' }),
  nationalCode: z
    .string('کدملی اجباری می باشد.')
    .min(1, { error: 'کدملی اجباری می باشد.' })
    .length(10, { error: 'کدملی باید 10 رقم باشد.' }),
  isLeader: z.boolean(),
  gender: z.enum(GenderEnum),
  department: z.object(
    {
      id: z.string(),
      label: z.string(),
    },
    { error: 'بخش کاربر اجباری می باشد.' },
  ),
  personnelNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  phoneNumber: phoneNumberSchema,
  imageFile: z
    .array(z.file())
    .max(1, 'فقط یک تصویر مجاز است.')
    .optional()
    .nullable(),
  role: z
    .array(z.enum(UserRoleEnum), { error: 'انتخاب حداقل یک نقش اجباری است.' })
    .min(1, {
      error: 'انتخاب حداقل یک نقش اجباری است.',
    }),
})

export const updateUserSchema = userSchema.extend({
  userId: z.string(),
  imageUrl: z.string().optional().nullable(),
})

export const updateUserSimSerialSchema = z.object({
  userId: z.string(),
  simSerial: z
    .string('شناسه اجباری می باشد.')
    .min(8, { error: 'شناسه حداقل باید 8 کاراکتر باشد.' }),
})
