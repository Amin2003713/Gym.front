import { createData, readBlob, readData } from '@/core/http-service'

/** Metadata of one encrypted progress photo; the bytes come from the content endpoint. */
export interface ProgressPhoto {
  id: string
  memberUserId: string
  takenOn: string
  contentType: string
  sizeBytes: number
  createdAt: string
}

const BASE = 'progressphotos'

export const progressPhotoApi = {
  upload: (file: File, takenOn: string) => {
    const form = new FormData()
    form.append('File', file)
    form.append('TakenOn', takenOn)

    return createData<FormData, ProgressPhoto>(BASE, form, undefined as never)
  },

  list: (memberId?: string) =>
    readData<ProgressPhoto[]>(
      `${BASE}${memberId ? `?memberId=${encodeURIComponent(memberId)}` : ''}`,
    ),

  /** Decrypted image bytes; the API authorizes the caller before decrypting. */
  content: (photoId: string) => readBlob(`${BASE}/${encodeURIComponent(photoId)}/content`),
}
