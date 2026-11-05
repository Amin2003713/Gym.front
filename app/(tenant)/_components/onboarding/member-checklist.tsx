'use client'

import { CheckCircle2, Circle, X } from '@/components/icons'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getOnboarding, updateOnboarding } from '@/app/(tenant)/_api/onboarding-api'
import {
  CHECKLIST_LABEL,
  type OnboardingState,
} from '@/app/(tenant)/_model/onboarding'

/**
 * Starter checklist for new members. The done flags come from the API (derived from real data), so
 * the card can never claim a step is finished when it is not. Hidden once all steps are done.
 */
export function MemberChecklist() {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const loaded = await getOnboarding()

        if (!cancelled) setState(loaded)
      } catch {
        /* The checklist is a helper; a failed read just hides it. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = async () => {
    setHidden(true)

    try {
      await updateOnboarding({ checklistDismissed: true })
    } catch {
      /* Ignored: the card is hidden locally either way. */
    }
  }

  if (!state || hidden || state.checklistDismissed) return null

  const items = state.checklist
    .map((item) => ({ ...item, meta: CHECKLIST_LABEL[item.key] }))
    .filter((item) => item.meta)

  if (!items.length || items.every((item) => item.done)) return null

  const done = items.filter((item) => item.done).length

  return (
    <section className="bg-card rounded-2xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-bold">شروع سریع</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {done} از {items.length} قدم · همین‌ها اپ را برایت راه می‌اندازند
          </p>
        </div>
        <button
          type="button"
          onClick={() => void dismiss()}
          aria-label="بستن چک‌لیست"
          className="text-muted-foreground hover:text-foreground -m-1 p-1"
        >
          <X className="size-4" />
        </button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.meta.href}
              className="hover:bg-muted/60 flex items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors"
            >
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="text-muted-foreground/50 size-4 shrink-0" />
              )}
              <span className={item.done ? 'text-muted-foreground line-through' : 'font-medium'}>
                {item.meta.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
