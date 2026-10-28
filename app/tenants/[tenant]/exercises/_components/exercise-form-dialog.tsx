'use client'

import { Check, LoaderCircle, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { toast } from '@/lib/toast'

import { exerciseApi } from '../_api/exercise-api'
import type { ExerciseDetail, ExerciseInput, ExerciseMuscleRole } from '../_model/exercise.types'


const fieldClass =
  'min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'
const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'
const buttonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

const emptyForm = (): ExerciseInput => ({
  name: '',
  description: '',
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
})

const val = (value?: string | null) => value ?? ''
const isGuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

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
  const [form, setForm] = useState<ExerciseInput>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true

    const load = async () => {
      if (!editingId) {
        setForm(emptyForm())
        return
      }
      setLoading(true)
      try {
        const detail: ExerciseDetail = await exerciseApi.get(editingId, 'fa')
        if (!active) return
        setForm({
          name: detail.name,
          description: detail.description ?? '',
          languageCode: detail.languageCode || 'fa',
          category: detail.category ?? '',
          bodyPart: detail.bodyPart ?? '',
          equipment: detail.equipment ?? '',
          target: detail.target ?? '',
          level: detail.level ?? '',
          mechanic: detail.mechanic ?? '',
          force: detail.force ?? '',
          exerciseType: detail.exerciseType ?? '',
          muscles: detail.muscles.map((m) => ({ muscleId: m.muscleId, role: m.role })),
          instructions: detail.instructions
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map((x) => x.text),
          media: detail.media.map((x) => ({
            assetId: x.asset.id,
            role: x.role,
            order: x.order,
            isPrimary: x.isPrimary,
          })),
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

  const updateForm = (key: keyof ExerciseInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('نام حرکت را وارد کنید.')
      return
    }
    if (form.muscles.some((m) => !isGuid(m.muscleId))) {
      toast.error('شناسه عضله باید یک GUID معتبر باشد.')
      return
    }
    setSaving(true)
    const payload: ExerciseInput = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      languageCode: form.languageCode || 'fa',
      category: form.category || null,
      bodyPart: form.bodyPart || null,
      equipment: form.equipment || null,
      target: form.target || null,
      level: form.level || null,
      mechanic: form.mechanic || null,
      force: form.force || null,
      exerciseType: form.exerciseType || null,
    }
    try {
      if (editingId) await exerciseApi.update(editingId, payload)
      else await exerciseApi.create(payload)
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
        className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-card shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 p-4 backdrop-blur">
          <div>
            <h2 id="exercise-editor-title" className="font-bold">
              {editingId ? 'ویرایش حرکت' : 'ثبت حرکت جدید'}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              اطلاعات مستقیماً به API حرکات ارسال می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            aria-label="بستن"
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <LoaderCircle className="size-7 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>نام حرکت *</span>
                <input
                  required
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>توضیحات</span>
                <textarea
                  rows={2}
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
                    value={val(form[key] as string)}
                    onChange={(e) => updateForm(key, e.target.value)}
                  />
                </label>
              ))}
              <label>
                <span className={labelClass}>زبان</span>
                <select
                  className={fieldClass}
                  value={form.languageCode || 'fa'}
                  onChange={(e) => updateForm('languageCode', e.target.value)}
                >
                  <option value="fa">فارسی (fa)</option>
                  <option value="en">English (en)</option>
                  <option value="de">Deutsch (de)</option>
                  <option value="ar">العربية (ar)</option>
                </select>
              </label>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <h3 className="font-semibold">عضلات مرتبط</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  شناسه عضله‌ها باید از دیتابیس خودتان باشد؛ برای هر شناسه یک خط بنویسید.
                  پیش‌فرض نقش عضله، اصلی است.
                </p>
              </div>
              <textarea
                rows={3}
                className={fieldClass}
                placeholder={
                  'GUID عضله، هر خط یک مورد\nمثال: 00000000-0000-0000-0000-000000000000'
                }
                value={form.muscles.map((x) => `${x.muscleId}${x.role === 2 ? '|2' : '|1'}`).join('\n')}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    muscles: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [muscleId, role] = line.split('|')
                        return {
                          muscleId: muscleId.trim(),
                          role: (role?.trim() === '2' ? 2 : 1) as ExerciseMuscleRole,
                        }
                      })
                      .filter((x) => x.muscleId),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                قالب اختیاری نقش: GUID|1 برای اصلی و GUID|2 برای کمکی.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <h3 className="font-semibold">دستورالعمل اجرا</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  هر خط یک مرحله؛ ترتیب خطوط حفظ می‌شود.
                </p>
              </div>
              <textarea
                rows={4}
                className={fieldClass}
                placeholder={'۱. وضعیت شروع...\n۲. حرکت را کنترل‌شده اجرا کنید...'}
                value={form.instructions.join('\n')}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    instructions: e.target.value
                      .split('\n')
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <h3 className="font-semibold">رسانه‌های آپلودشده</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  ابتدا از ماژول Media فایل را آپلود کنید، سپس Asset ID و مقدار عددی enum
                  مربوط به ExerciseMediaRole را وارد کنید.
                </p>
              </div>
              <textarea
                rows={2}
                className={fieldClass}
                placeholder={'Asset GUID|RoleNumber|primary\nمثال: GUID|مقدار enum|primary'}
                value={form.media
                  .map((x) => `${x.assetId}|${x.role}${x.isPrimary ? '|primary' : ''}`)
                  .join('\n')}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    media: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, index) => {
                        const [assetId, roleText, primaryText] = line.split('|')
                        return {
                          assetId: assetId.trim(),
                          role: Number(roleText),
                          order: index,
                          isPrimary: primaryText?.trim() === 'primary',
                        }
                      })
                      .filter((x) => x.assetId && Number.isFinite(x.role)),
                  }))
                }
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => onOpenChange(false)}
                className={`${buttonClass} border bg-background`}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${buttonClass} bg-primary text-primary-foreground`}
              >
                {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                {editingId ? 'ذخیره تغییرات' : 'ثبت حرکت'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
