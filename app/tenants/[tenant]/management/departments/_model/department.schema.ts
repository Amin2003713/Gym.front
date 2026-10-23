import { z } from 'zod'

const baseSchema = z.object({
  title: z
    .string('نام بخش الزامی است.')
    .min(1, { error: 'نام بخش الزامی است.' }),
  parentDepartment: z
    .object({
      id: z.string(),
      label: z.string(),
    })
    .optional()
    .nullable(),
  managers: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      }),
    )
    .optional()
    .nullable(),
})

export const addDepartmentSchema = baseSchema
export const updateDepartmentSchema = baseSchema.extend({
  id: z
    .string('شناسه بخش نامعتبر است.')
    .min(1, { error: 'شناسه بخش نامعتبر است.' }),
})
