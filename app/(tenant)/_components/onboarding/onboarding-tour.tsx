'use client'

import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getOnboarding, updateOnboarding } from '@/app/(tenant)/_api/onboarding-api'
import { TOUR_BY_ROLE, type OnboardingState } from '@/app/(tenant)/_model/onboarding'
import { Button } from '@/components/ui/button'

/**
 * First-run tour, one flow per role. It is mounted once in the tenant layout, so both the member app
 * and the console get it; the tour only renders while the stored `tourCompleted` flag is false.
 */
export function OnboardingTour() {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const loaded = await getOnboarding()

        if (cancelled) return

        setState(loaded)
        setOpen(!loaded.tourCompleted)
      } catch {
        /* First-run help is optional: a failed read must never block the app. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const finish = async () => {
    setOpen(false)

    try {
      const updated = await updateOnboarding({ tourCompleted: true })
      setState(updated)
    } catch {
      /* The tour reappears next visit if this fails; nothing else depends on it. */
    }
  }

  if (!open || !state) return null

  const steps = TOUR_BY_ROLE[state.role] ?? TOUR_BY_ROLE.Trainee
  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="راهنمای شروع"
      dir="rtl"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      onKeyDown={(event) => {
        if (event.key === 'Escape') void finish()
      }}
    >
      <div className="bg-card w-full max-w-md rounded-2xl border p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === step ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-1.5'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => void finish()}
            aria-label="بستن راهنما"
            className="text-muted-foreground hover:text-foreground -m-1 p-1"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-extrabold">{current.title}</h2>
        <p className="text-muted-foreground mt-2 min-h-20 text-sm leading-7">{current.body}</p>

        {current.href && (
          <Link
            href={current.href}
            onClick={() => void finish()}
            className="text-primary inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            {current.cta}
            <ArrowLeft className="size-3.5" />
          </Link>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            <ArrowRight className="size-4" />
            قبلی
          </Button>

          {last ? (
            <Button size="sm" onClick={() => void finish()}>
              شروع میکنم
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((value) => value + 1)}>
              بعدی
              <ArrowLeft className="size-4" />
            </Button>
          )}
        </div>

        {!last && (
          <button
            type="button"
            onClick={() => void finish()}
            className="text-muted-foreground hover:text-foreground mt-3 w-full text-center text-[11px]"
          >
            رد کردن راهنما
          </button>
        )}
      </div>
    </div>
  )
}
