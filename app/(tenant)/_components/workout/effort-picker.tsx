'use client'

import { Flame, Minus, Plus } from '@/components/icons'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Adaptive effort entry, adapted from the reference picker's behaviour (one-tap presets plus an
 * exact value) but rendered with this app's tokens and dialog shell.
 *
 * Presets are RIR (reps in reserve): the colour is the effort, not the number, so 0 is the
 * "went to failure" end and 5+ is still comfortable. The exact field stays for anyone logging
 * RPE/RIR outside the presets.
 */
const PRESETS: Array<{ rir: number; label: string; tone: string }> = [
  { rir: 0, label: 'رفع تا ناتوانی', tone: 'border-destructive/35 bg-destructive/10 text-destructive' },
  { rir: 1, label: '۱ تکرار در ذخیره', tone: 'border-warning/35 bg-warning/10 text-warning' },
  { rir: 2, label: '۲ تکرار در ذخیره', tone: 'border-warning/25 bg-warning/5 text-foreground' },
  { rir: 3, label: '۳ تکرار در ذخیره', tone: 'border-primary/30 bg-primary/10 text-foreground' },
  { rir: 4, label: '۴ تکرار در ذخیره', tone: 'border-primary/20 bg-primary/5 text-foreground' },
  { rir: 5, label: '۵+ تکرار در ذخیره', tone: 'border-border bg-muted/50 text-muted-foreground' },
]

const clamp = (value: number) => Math.max(0, Math.min(10, Math.round(value)))

export function EffortPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const current = value == null ? null : clamp(value)

  const pick = (next: number | null) => {
    onChange(next == null ? null : clamp(next))
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="انتخاب شدت ست"
        className={cn(
          'border-input bg-background hover:bg-muted focus-visible:ring-ring flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-2.5 text-xs transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2',
          current == null && 'text-muted-foreground',
        )}
      >
        <span className="flex items-center gap-1.5">
          <Flame className="size-3.5" aria-hidden />
          {current == null ? 'شدت (RIR)' : `RIR ${current}`}
        </span>
        <span className="text-muted-foreground text-[10px]">
          {current == null ? 'انتخاب' : 'تغییر'}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>این ست چقدر سخت بود؟</DialogTitle>
            <DialogDescription>
              چند تکرار دیگر می‌توانستی بزنی؟ رنگ، شدت را نشان می‌دهد نه عدد را.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.rir}
                type="button"
                onClick={() => pick(preset.rir)}
                aria-pressed={current === preset.rir}
                className={cn(
                  'focus-visible:ring-ring flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-start text-xs font-semibold transition-transform active:scale-[.99] focus-visible:ring-[3px] focus-visible:ring-offset-2',
                  preset.tone,
                  current === preset.rir && 'ring-2 ring-primary/40',
                )}
              >
                <span>{preset.label}</span>
                <span className="tabular-nums opacity-80">{preset.rir}</span>
              </button>
            ))}
          </div>

          <div className="rounded-lg border p-2.5">
            <p className="text-muted-foreground mb-2 text-[11px]">مقدار دقیق (۰ تا ۱۰)</p>
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="کاهش شدت"
                onClick={() => onChange(clamp((current ?? 0) - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="text-lg font-extrabold tabular-nums">{current ?? '–'}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="افزایش شدت"
                onClick={() => onChange(clamp((current ?? -1) + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => pick(null)}>
              پاک کردن
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              تأیید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
