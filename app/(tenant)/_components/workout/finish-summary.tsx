'use client'

import { CheckCircle2, Loader2, Trophy, Upload } from 'lucide-react'
import { useState } from 'react'

import { progressPhotoApi } from '@/app/(tenant)/_api/progress-photo-api'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import type { CompleteSessionResponse } from '@/app/(tenant)/_model/workout.types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')
const today = () => new Date().toISOString().slice(0, 10)

/**
 * The finish step, modelled on the reference app's summary: the session's totals, the records it
 * produced, the muscles it trained, and the existing encrypted progress-photo upload — so a photo
 * taken right after the session lands on the member's record without leaving the screen.
 */
export function FinishSummary({
  open,
  onOpenChange,
  result,
  load,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: CompleteSessionResponse | null
  /** Muscle → load for the "what you just trained" map. */
  load: Record<string, number>
  onDone: () => void
}) {
  const [takenOn, setTakenOn] = useState(today)
  const [uploading, setUploading] = useState(false)

  if (!result) return null

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
    } catch (error) {
      toast.error('بارگذاری عکس ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
            <Trophy className="size-7" aria-hidden />
          </span>
          <DialogTitle className="text-lg">تمرین کامل شد</DialogTitle>
          <DialogDescription>
            {fa(result.durationMinutes)} دقیقه تمرین، {fa(result.totalSets)} ست و{' '}
            {fa(Math.round(result.totalVolumeKg))} کیلوگرم حجم.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 text-start">
          {[
            { label: 'مدت', value: `${fa(result.durationMinutes)} دقیقه` },
            { label: 'حجم', value: `${fa(Math.round(result.totalVolumeKg))} kg` },
            { label: 'ست‌ها', value: fa(result.totalSets) },
            {
              label: 'رکوردها',
              value: result.newPrs?.length ? fa(result.newPrs.length) : '—',
            },
          ].map((tile) => (
            <div key={tile.label} className="bg-muted/40 rounded-xl border p-3">
              <p className="text-muted-foreground text-[11px]">{tile.label}</p>
              <p className="mt-1 text-sm font-extrabold tabular-nums">{tile.value}</p>
            </div>
          ))}
        </div>

        {result.newPrs?.length ? (
          <ul className="space-y-1 text-start">
            {result.newPrs.map((pr) => (
              <li key={pr.exerciseId} className="text-primary flex items-center gap-1.5 text-xs font-semibold">
                <Trophy className="size-3.5" aria-hidden />
                {pr.exerciseName ?? pr.exerciseId}: {fa(pr.weightKg)} کیلوگرم
              </li>
            ))}
          </ul>
        ) : null}

        {Object.keys(load).length > 0 && (
          <div className="border-t pt-3">
            <p className="mb-1 text-start text-xs font-bold">چیزی که تمرین کردی</p>
            <BodyMapPanel body="male" palette="load" load={load} />
          </div>
        )}

        <div className="border-t pt-3">
          <p className="mb-2 text-start text-xs font-bold">عکس پیشرفت این جلسه</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-[11px]">
              <span className="text-muted-foreground">تاریخ عکس</span>
              <Input
                type="date"
                value={takenOn}
                max={today()}
                onChange={(event) => setTakenOn(event.target.value)}
              />
            </label>
            <label className="hover:bg-muted inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold">
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-3.5" aria-hidden />
              )}
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
        </div>

        <Button onClick={onDone} className="w-full">
          <CheckCircle2 className="size-4" aria-hidden />
          بازگشت به خانه
        </Button>
      </DialogContent>
    </Dialog>
  )
}
