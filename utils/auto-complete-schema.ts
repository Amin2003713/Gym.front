import { z } from 'zod'

export const autoCompleteSchema = (required: boolean) => {
  if (required) {
    return z.object(
      {
        id: z.string().nullable(),
        label: z.string(),
      },
      { message: 'این فیلد الزامی است !' },
    )
  } else {
    return z
      .object({
        id: z.string().nullable(),
        label: z.string(),
      })
      .optional()
      .nullable()
  }
}
