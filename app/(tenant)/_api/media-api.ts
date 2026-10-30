import { createData, readData } from '@/core/http-service'

/** Response of POST media/uploads (one multipart request, image stored as WebP variants). */
export interface MediaUploadResponse {
  assetId: string
  uploadSessionId: string
  objectKey: string
  presignedPutUrl: string
  expiresAtUtc: string
  requiredHeaders: Record<string, string>
}

export interface MediaDownloadUrl {
  url: string
  /** 0 = original, other values are generated variants. */
  kind: number
}

const BASE = 'media'

export interface UploadedMedia {
  assetId: string
  url: string
}

export const mediaApi = {
  /**
   * Uploads one image through the tenant media library and returns the asset id
   * (needed to link the file to an exercise) plus a URL that can be stored on a
   * user (avatar) or shown as a preview.
   */
  async uploadImage(file: File): Promise<UploadedMedia> {
    const form = new FormData()
    form.append('File', file)

    const uploaded = await createData<FormData, MediaUploadResponse>(
      `${BASE}/uploads`,
      form,
      undefined as never,
    )

    const urls = await readData<MediaDownloadUrl[]>(
      `${BASE}/url?assetId=${encodeURIComponent(uploaded.assetId)}`,
    )

    const url = urls[0]?.url

    if (!url) throw new Error('آدرس فایل بارگذاری‌شده دریافت نشد.')

    return { assetId: uploaded.assetId, url }
  },
}
