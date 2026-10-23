import z from 'zod'

export const forgetPassword = z.object({
  userName: z.string().length(11, { error: 'حداقل باید 11 کاراکتر باشد' }),
})
