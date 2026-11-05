'use client'

import { Check, LoaderCircle, UploadCloud, X } from '@/components/icons'
import { useEffect, useState, type FormEvent } from 'react'

import { mediaApi } from '@/app/(tenant)/_api/media-api'
import { toast } from '@/lib/toast'

import { exerciseApi } from '../_api/exercise-api'
import type { ExerciseDetail, ExerciseInput, ExerciseMediaRole } from '../_model/exercise.types'
import MusclePicker, { type PickedMuscle } from './muscle-picker'

const fieldClass =
  'min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'
const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'
const buttonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

type MediaRow = {
  assetId: string
  role: ExerciseMediaRole
  order: number
  isPrimary: boolean
  fileName?: string
  url?: string
}

type FormState = Omit<ExerciseInput, 'muscles' | 'media'> & {
  muscles: PickedMuscle[]
  media: MediaRow[]
  publishToLibrary: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  // Persian is the only authoring language for now.
  languageCode: 'fa',
  category: '',
  bodyPart: '',
  equipment: '',
  target: '',
  level: '',
  mechanic: '',
  force: '',
  exerciseType: '',
  muscles: [],
  instructions: [],
  media: [],
  publishToLibrary: false,
})

const val = (value?: string | null) => value ?? ''

interface ExerciseFormDialogProps {
  open: boolean
  editingId: string | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export default function ExerciseFormDialog({
  open,
  editingId,
  onOpenChange,
  onSaved,
}: ExerciseFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [owned, setOwned] = useState(true)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true

    const load = async () => {
      if (!editingId) {
        setForm(emptyForm())
        setOwned(true)
        setVerified(false)
        return
      }

      setLoading(true)

      try {
        const detail: ExerciseDetail = await exerciseApi.get(editingId, 'fa')
        if (!active) return

        setOwned(detail.isOwned ?? false)
        setVerified(detail.isVerified ?? false)
        setForm({
          name: detail.name,
          description: detail.description ?? '',
          languageCode: 'fa',
          category: detail.category ?? '',
          bodyPart: detail.bodyPart ?? '',
          equipment: detail.equipment ?? '',
          target: detail.target ?? '',
          level: detail.level ?? '',
          mechanic: detail.mechanic ?? '',
          force: detail.force ?? '',
          exerciseType: detail.exerciseType ?? '',
          muscles: detail.muscles.map((m) => ({ muscleId: m.muscleId, role: m.role })),
          instructions: [...detail.instructions]
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map((x) => x.text),
          media: detail.media.map((x) => ({
            assetId: x.asset.id,
            role: x.role as ExerciseMediaRole,
            order: x.order,
            isPrimary: x.isPrimary,
            fileName: x.asset.originalFileName,
            url: x.asset.variants?.find((v) => v.url)?.url ?? undefined,
          })),
          publishToLibrary: detail.isPublished ?? false,
        })
      } catch {
        toast.error('جزئیات حرکت دریافت نشد.')
        onOpenChange(false)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [open, editingId, onOpenChange])

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const upload = async (file: File | undefined) => {
    if (!file) return

    setUploading(true)

    try {
      const { assetId, url } = await mediaApi.uploadImage(file)
      const isAnimation = file.type === 'image/gif'

      setForm((prev) => ({
        ...prev,
        media: [
          ...prev.media,
          {
            assetId,
            role: (isAnimation ? 1 : 0) as ExerciseMediaRole,
            order: prev.media.length,
            isPrimary: prev.media.length === 0,
            fileName: file.name,
            url,
          },
        ],
      }))

      toast.success('رسانه بارگذاری شد')
    } catch (error) {
      toast.error('بارگذاری رسانه ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setUploading(false)
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('نام حرکت را وارد کنید.')
      return
    }

    if (form.muscles.length === 0) {
      toast.error('حداقل یک عضله انتخاب کنید.')
      return
    }

    setSaving(true)

    const payload: ExerciseInput = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      languageCode: 'fa',
      category: form.category || null,
      bodyPart: form.bodyPart || null,
      equipment: form.equipment || null,
      target: form.target || null,
      level: form.level || null,
      mechanic: form.mechanic || null,
      force: form.force || null,
      exerciseType: form.exerciseType || null,
      muscles: form.muscles.map((m) => ({ muscleId: m.muscleId, role: m.role })),
      media: form.media.map(({ assetId, role, order, isPrimary }) => ({
        assetId,
        role,
        order,
        isPrimary,
      })),
      publishToLibrary: form.publishToLibrary,
    }

    try {
      if (editingId) await exerciseApi.update(editingId, payload)
      else await exerciseApi.create(payload)

      // The publish switch lives outside the create payload for existing exercises.
      if (editingId) {
        await exerciseApi.publish(editingId, form.publishToLibrary)
      }

      toast.success(editingId ? 'حرکت به‌روزرسانی شد.' : 'حرکت ایجاد شد.')
      onOpenChange(false)
      onSaved()
    } catch (error) {
      const err = error as { message?: string }
      toast.error(err.message || 'ذخیره حرکت ناموفق بود.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const readOnly = Boolean(editingId) && !owned

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onOpenChange(false)
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-editor-title"
        className="bg-card max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-lg border shadow-2xl"
      >
        <div className="bg-card/95 sticky top-0 z-10 flex items-center justify-between border-b p-4 backdrop-blur">
          <div>
            <h2 id="exercise-editor-title" className="font-bold">
              {editingId ? 'ویرایش حرکت' : 'ثبت حرکت جدید'}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              عضلات از سرور خوانده می‌شوند و رسانه از کتابخانه رسانه باشگاه بارگذاری می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            aria-label="بستن"
            className="hover:bg-muted rounded-lg p-2"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <LoaderCircle className="text-primary size-7 animate-spin" />
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 p-4 sm:p-6">
            {readOnly && (
              <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                این حرکت از کتابخانه عمومی است یا توسط باشگاه دیگری ثبت شده؛ فقط نمایش داده می‌شود.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>نام حرکت *</span>
                <input
                  required
                  disabled={readOnly}
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>توضیحات</span>
                <textarea
                  rows={2}
                  disabled={readOnly}
                  className={fieldClass}
                  value={val(form.description)}
                  onChange={(e) => updateForm('description', e.target.value)}
                />
              </label>
              {(
                [
                  { key: 'category', label: 'دسته' },
                  { key: 'bodyPart', label: 'ناحیه بدن' },
                  { key: 'equipment', label: 'تجهیزات' },
                  { key: 'target', label: 'عضله/هدف' },
                  { key: 'level', label: 'سطح' },
                  { key: 'mechanic', label: 'مکانیک' },
                  { key: 'force', label: 'نوع نیرو' },
                  { key: 'exerciseType', label: 'نوع حرکت' },
                ] as const
              ).map(({ key, label }) => (
                <label key={key}>
                  <span className={labelClass}>{label}</span>
                  <input
                    className={fieldClass}
                    disabled={readOnly}
                    value={val(form[key] as string)}
                    onChange={(e) => updateForm(key, e.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">عضلات مرتبط *</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  از فهرست سرور انتخاب کنید؛ اگر عضله‌ای نیست، همان‌جا با نام فارسی اضافه کنید و
                  نقش هر عضله (اصلی/کمکی) را با کلیک روی برچسب تغییر دهید.
                </p>
              </div>
              <MusclePicker
                value={form.muscles}
                onChange={(next) => updateForm('muscles', next)}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">دستورالعمل اجرا</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  هر خط یک مرحله؛ ترتیب خطوط حفظ می‌شود.
                </p>
              </div>
              <textarea
                rows={4}
                disabled={readOnly}
                className={fieldClass}
                placeholder={'۱. وضعیت شروع...\n۲. حرکت را کنترل‌شده اجرا کنید...'}
                value={form.instructions.join('\n')}
                onChange={(e) =>
                  updateForm(
                    'instructions',
                    e.target.value
                      .split('\n')
                      .map((x) => x.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">رسانه (GIF، تصویر، ویدیو)</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    فایل مستقیماً در کتابخانه رسانه باشگاه بارگذاری و به حرکت متصل می‌شود.
                  </p>
                </div>
                <label
                  className={`${buttonClass} cursor-pointer border bg-background`}
                  aria-disabled={readOnly || uploading}
                >
                  {uploading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <UploadCloud className="size-4" />
                  )}
                  افزودن رسانه
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="sr-only"
                    disabled={readOnly || uploading}
                    onChange={(event) => void upload(event.target.files?.[0])}
                  />
                </label>
              </div>

              {form.media.length > 0 ? (
                <ul className="space-y-2">
                  {form.media.map((item, index) => (
                    <li
                      key={item.assetId}
                      className="flex items-center gap-3 rounded-lg border p-2"
                    >
                      {item.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={item.fileName ?? 'رسانه حرکت'}
                          className="bg-muted size-12 rounded object-cover"
                        />
                      ) : (
                        <span className="bg-muted size-12 rounded" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {item.fileName ?? 'رسانه بارگذاری‌شده'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <label className="flex items-center gap-1">
                            <span>نقش</span>
                            <select
                              className="border-input bg-background rounded border px-1 py-0.5"
                              value={item.role}
                              disabled={readOnly}
                              onChange={(event) =>
                                updateForm(
                                  'media',
                                  form.media.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? {
                                          ...row,
                                          role: Number(event.target.value) as ExerciseMediaRole,
                                        }
                                      : row,
                                  ),
                                )
                              }
                            >
                              <option value={0}>تصویر</option>
                              <option value={1}>انیمیشن (GIF)</option>
                              <option value={2}>فریم</option>
                            </select>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={item.isPrimary}
                              disabled={readOnly}
                              onChange={(event) =>
                                updateForm(
                                  'media',
                                  form.media.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? { ...row, isPrimary: event.target.checked }
                                      : row,
                                  ),
                                )
                              }
                            />
                            تصویر اصلی
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() =>
                          updateForm(
                            'media',
                            form.media.filter((_, rowIndex) => rowIndex !== index),
                          )
                        }
                        aria-label="حذف رسانه"
                        className="hover:bg-muted rounded p-1.5"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">رسانه‌ای اضافه نشده است.</p>
              )}
            </div>

            {owned && (
              <label className="flex items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  checked={form.publishToLibrary}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateForm('publishToLibrary', event.target.checked)
                  }
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="block font-semibold">انتشار در کتابخانه مشترک</span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-5">
                    اگر این گزینه خاموش باشد، حرکت فقط برای همین باشگاه نمایش داده می‌شود.
                    برای نمایش به همه باشگاه‌ها، حرکت باید ابتدا منتشر و سپس توسط پلتفرم
                    تأیید شود.
                    {editingId && (
                      <span className="mt-1 block font-semibold">
                        وضعیت تأیید: {verified ? 'تأییدشده' : 'در انتظار بررسی'}
                      </span>
                    )}
                  </span>
                </span>
              </label>
            )}

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => onOpenChange(false)}
                className={`${buttonClass} bg-background border`}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving || readOnly}
                className={`${buttonClass} bg-primary text-primary-foreground`}
              >
                {saving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {editingId ? 'ذخیره تغییرات' : 'ثبت حرکت'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

