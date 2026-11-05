'use client'

import { TimerReset, X } from '@/components/icons'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const STEP_SECONDS = 15

const clock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export type RestResult = { seconds: number; skipped: boolean }

/**
 * Rest countdown between sets. It owns its tick, and reports how the rest actually ended so the
 * next logged set can carry the measured rest time (and whether it was skipped) into the session.
 */
export function RestTimer({
  seconds,
  onFinish,
}: {
  /** Rest the coach prescribed for the set, in seconds. */
  seconds: number
  onFinish: (result: RestResult) => void
}) {
  const [total, setTotal] = useState(Math.max(1, seconds))
  const [remaining, setRemaining] = useState(Math.max(1, seconds))
  const startedAt = useRef<number | null>(null)
  const finished = useRef(false)

  const finish = useCallback(
    (skipped: boolean) => {
      if (finished.current) return
      finished.current = true

      const start = startedAt.current ?? Date.now()
      const elapsed = Math.round((Date.now() - start) / 1000)
      onFinish({ seconds: Math.max(0, Math.min(total, elapsed)), skipped })
    },
    [onFinish, total],
  )

  // The start stamp is taken after mount; reading the clock during render would make the
  // component impure (and the value would drift on every re-render).
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (remaining > 0 || finished.current) return
    finish(false)
  }, [remaining, finish])

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => finish(true)}
          aria-label="رد کردن استراحت و ثبت زمان سپری‌شده"
        >
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
