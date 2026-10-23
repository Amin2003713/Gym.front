import z from 'zod'

import { FileType } from '@/enums/file-types.enum'

export const mediaSchema = z.object({
  compressed: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  type: z.enum(FileType).optional().nullable(),
  extension: z.string().optional().nullable(),
  url: z.string(),
})
