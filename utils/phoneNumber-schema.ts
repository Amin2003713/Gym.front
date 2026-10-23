import z from 'zod'

export const phoneNumberSchema = z
  .string({ error: 'این فیلد اجباری است !' })
  .length(11, { error: 'شماره تلفن نامعتبر است !' })
