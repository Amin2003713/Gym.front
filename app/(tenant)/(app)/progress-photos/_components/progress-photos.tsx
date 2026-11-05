'use client'


import { ImageUp, Loader2 } from '@/components/icons'
import { useCallback, useEffect, useState } from 'react'

import { progressPhotoApi, type ProgressPhoto } from '@/app/(tenant)/_api/progress-photo-api'
import { PersianDateInput } from '@/components/ui/persian-date-input'
import { toast } from '@/lib/toast'

const today = () => new Date().toISOString().slice(0, 10)
const fa = (value: number) => value.toLocaleString('fa-IR')

/**
 * The member's own progress photos. Images are uploaded encrypted and read back through the
 * authorized content endpoint; the browser only ever holds object URLs of decrypted responses.
 */
export function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [takenOn, setTakenOn] = useState(today())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await progressPhotoApi.list()
      setPhotos(rows)

      const entries = await Promise.all(
        rows.map(async (photo) => {
          const blob = await progressPhotoApi.content(photo.id)
          return [photo.id, URL.createObjectURL(blob)] as const
        }),
      )

      setPreviews((current) => {
        Object.values(current).forEach((url) => URL.revokeObjectURL(url))
        return Object.fromEntries(entries)
      })
    } catch (error) {
      toast.error('دریافت عکس‌ها ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Deferred one tick so the first render is not re-entered by the load's own setState calls.
    const timer = setTimeout(() => void load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  // Object URLs are released when the screen goes away.
  useEffect(
    () => () => {
      setPreviews((current) => {
        Object.values(current).forEach((url) => URL.revokeObjectURL(url))
        return {}
      })
    },
    [],
  )

  const upload = async (file: File | undefined) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل تصویری پذیرفته می‌شود.')
      return
    }

    setUploading(true)
    try {
      await progressPhotoApi.upload(file, takenOn)
      toast.success('عکس پیشرفت ذخیره شد')
      await load()
    } catch (error) {
      toast.error('بارگذاری عکس ناموفق بود', {
        description: error instanceof Error ? error.message : 'حداکثر ۱۵ مگابایت، JPEG/PNG/WebP/HEIC.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold">عکس پیشرفت</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          عکس‌ها پیش از ذخیره رمزنگاری می‌شوند و فقط شما و مربی‌تان می‌توانید آن‌ها را ببینید.
        </p>
      </header>

      <section className="bg-card rounded-lg border p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span>تاریخ عکس</span>
            <PersianDateInput value={takenOn} max={today()} onValueChange={setTakenOn} />
          </label>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
            {uploading ? 'در حال بارگذاری…' : 'افزودن عکس'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                void upload(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </label>
        </div>
      </section>

      {loading ? (
        <div className="text-muted-foreground flex min-h-48 items-center justify-center gap-2 text-sm">
          <Loader2 className="size-5 animate-spin" />
          در حال رمزگشایی و نمایش…
        </div>
      ) : photos.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          هنوز عکسی ثبت نشده است.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="bg-card overflow-hidden rounded-lg border shadow-sm">
              {previews[photo.id] ? (
                // Object URL of an authorized, decrypted response.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[photo.id]}
                  alt={`عکس پیشرفت ${photo.takenOn}`}
                  className="bg-muted aspect-3/4 w-full object-cover"
                />
              ) : (
                <div className="bg-muted aspect-3/4 w-full animate-pulse" />
              )}
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="font-semibold tabular-nums">{photo.takenOn}</span>
                <span className="text-muted-foreground">{fa(photo.sizeBytes)} بایت</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground text-xs leading-5">
        هر عکس با کلید سیستم و nonce یکتا رمز می‌شود؛ داده ذخیره‌شده بدون احراز هویت قابل خواندن
        نیست.
      </p>
    </div>
  )
}
