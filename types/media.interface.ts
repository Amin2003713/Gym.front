import { FileType } from '@/enums/file-types.enum'

export interface Media {
  compressed?: string
  fileName: string
  type: FileType
  extension?: string
  fileSize?: number
  url: string
}
