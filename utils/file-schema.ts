import z from 'zod'

export const fileSchema = (pdfIncluded: boolean) => {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    ...(pdfIncluded ? ['application/pdf'] : []),
  ]

  return z
    .instanceof(File)
    .refine(
      (file) => {
        return validTypes.includes(file.type)
      },
      {
        message: 'فرمت فایل باید jpeg، png، webp یا pdf باشد.',
      },
    )
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'حجم فایل باید کمتر از 5 مگابایت باشد.',
    })
}
