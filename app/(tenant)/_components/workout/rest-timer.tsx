'use client'

import { TimerReset, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const STEP_SECONDS = 15

const clock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Rest countdown between sets (mirrors the sheet template): a large clock, a progress bar and two
 * one-tap actions - add time or skip. It owns its tick so the session runner never re-renders on
 * every second.
 */
export function RestTimer({
  seconds,
  onDone,
}: {
  /** Rest the coach prescribed for the set, in seconds. */
  seconds: number
  onDone: () => void
}) {
  const [total, setTotal] = useState(Math.max(1, seconds))
  const [remaining, setRemaining] = useState(Math.max(1, seconds))
  const finished = useRef(false)

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (remaining > 0 || finished.current) return

    finished.current = true
    onDone()
  }, [remaining, onDone])

  const addTime = () => {
    setTotal((value) => value + STEP_SECONDS)
    setRemaining((value) => value + STEP_SECONDS)
  }

  const elapsed = Math.max(0, Math.min(100, ((total - remaining) / total) * 100))

  return (
    <section
      className="bg-card rounded-xl border p-4"
      aria-live="polite"
      aria-label="زمان استراحت"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-semibold">استراحت بین ست‌ها</p>
        <Button variant="ghost" size="sm" onClick={onDone} aria-label="رد کردن استراحت">
          <X className="size-4" />
          رد کردن
        </Button>
      </div>

      <p className="mt-1 text-center text-4xl font-extrabold tabular-nums tracking-tight">
        {clock(remaining)}
      </p>

      <Progress value={elapsed} className="mt-3 h-1.5" />

      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={addTime}>
        <TimerReset className="size-4" />
        {STEP_SECONDS} ثانیه بیشتر
      </Button>
    </section>
  )
}
