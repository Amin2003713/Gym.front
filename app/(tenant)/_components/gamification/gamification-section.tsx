'use client'

import { Award, Flame, Sparkles, Trophy } from '@/components/icons'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getGamification } from '@/app/(tenant)/_api/gamification-api'
import { getPreferences } from '@/app/(tenant)/_api/preferences-api'
import {
  BADGE_COPY,
  levelTitle,
  type GamificationBadge,
  type GamificationData,
} from '@/app/(tenant)/_model/gamification'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const SEEN_KEY = 'hamowj.seen-badges'

function seenBadges(): string[] {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function rememberBadges(codes: string[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(SEEN_KEY, JSON.stringify(codes))
}

/**
 * The one gamification surface. It reads the derived score and the member's preferences, hides
 * itself completely when the gamification opt-out is on, and fires the "new badge" micro-trigger
 * once per badge per browser (only when in-app notifications are enabled).
 */
export function GamificationSection({ variant = 'card' }: { variant?: 'card' | 'full' }) {
  const [data, setData] = useState<GamificationData | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [preferences, score] = await Promise.all([getPreferences(), getGamification()])

        if (cancelled) return

        setData(
          preferences.gamificationEnabled
            ? score
            : null,
        )

        if (!preferences.gamificationEnabled || !preferences.notificationsEnabled) return

        const earned = score.badges.filter((badge) => badge.earned).map((badge) => badge.code)
        const seen = seenBadges()
        const fresh = earned.filter((code) => !seen.includes(code))

        if (fresh.length === 0) return

        rememberBadges([...seen, ...fresh])

        toast.success(
          fresh.length === 1
            ? `نشان جدید: ${BADGE_COPY[fresh[0]]?.title ?? fresh[0]}`
            : `${fa(fresh.length)} نشان جدید باز شد`,
          { description: 'در صفحه آمار همه نشان‌ها را ببین' },
        )
      } catch {
        /* Gamification is decoration: a failed read must never break the page. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!data) return null

  const progress = Math.round((data.xpInLevel / Math.max(1, data.xpForNextLevel)) * 100)
  const earned = data.badges.filter((badge) => badge.earned)

  if (variant === 'card') {
    return (
      <Link
        href="/stats"
        className="bg-card hover:border-primary/40 block rounded-2xl border p-4 shadow-sm transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary/12 text-primary flex size-9 items-center justify-center rounded-xl">
              <Trophy className="size-5" />
            </span>
            <div>
              <p className="text-muted-foreground text-xs">سطح {fa(data.level)} · {levelTitle(data.level)}</p>
              <p className="text-lg font-extrabold">{fa(data.totalXp)} XP</p>
            </div>
          </div>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Flame className="size-3.5 text-amber-500" />
            {fa(data.currentStreakDays)} روز
          </span>
        </div>

        <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-muted-foreground mt-1.5 text-[11px]">
          {fa(data.xpForNextLevel - data.xpInLevel)} XP تا سطح بعد · {fa(earned.length)} نشان
        </p>
      </Link>
    )
  }

  return (
    <div className="space-y-4">
      <section className="from-primary text-primary-foreground relative overflow-hidden rounded-2xl bg-gradient-to-br to-emerald-700 p-4 shadow-sm">
        <div className="pointer-events-none absolute -top-8 -left-6 size-28 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs opacity-90">سطح {fa(data.level)}</p>
            <p className="text-2xl font-extrabold">{levelTitle(data.level)}</p>
            <p className="mt-1 text-xs opacity-90">
              {fa(data.totalXp)} XP · {fa(data.sessionsCompleted)} جلسه · {fa(data.totalSets)} ست
            </p>
          </div>
          <Award className="size-8 opacity-80" />
        </div>

        <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white/90" style={{ width: `${progress}%` }} />
        </div>
        <p className="relative mt-1.5 text-[11px] opacity-90">
          {fa(data.xpInLevel)} از {fa(data.xpForNextLevel)} XP این سطح
        </p>
      </section>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'زنجیره فعلی', value: `${fa(data.currentStreakDays)} روز` },
          { label: 'بهترین زنجیره', value: `${fa(data.longestStreakDays)} روز` },
          { label: 'حجم کل', value: `${fa(Math.round(data.totalVolumeKg))} kg` },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-xl border p-3 text-center shadow-sm">
            <p className="text-muted-foreground text-[10px]">{item.label}</p>
            <p className="mt-1 text-sm font-extrabold">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-card rounded-2xl border p-4 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold">
          <Sparkles className="text-primary size-4" />
          نشان‌ها
          <span className="text-muted-foreground text-xs font-normal">
            {fa(earned.length)} از {fa(data.badges.length)}
          </span>
        </h2>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.badges.map((badge) => (
            <BadgeTile key={badge.code} badge={badge} />
          ))}
        </ul>

        <p className="text-muted-foreground mt-3 text-[11px] leading-5">
          امتیاز هر جلسه ۵۰ XP به‌علاوه پاداش حجم است (حداکثر ۱۰۰). می‌توانی این بخش را در
          تنظیمات ← اعلان‌ها خاموش کنی.
        </p>
      </section>
    </div>
  )
}

function BadgeTile({ badge }: { badge: GamificationBadge }) {
  const copy = BADGE_COPY[badge.code]

  return (
    <li
      className={`rounded-xl border px-3 py-2.5 ${
        badge.earned ? 'border-primary/40 bg-primary/5' : 'border-dashed opacity-60'
      }`}
    >
      <p className="text-xs font-bold">{copy?.title ?? badge.code}</p>
      <p className="text-muted-foreground mt-0.5 text-[11px] leading-5">
        {badge.earned && badge.earnedOn
          ? `کسب‌شده در ${new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(new Date(`${badge.earnedOn}T12:00:00`))}`
          : (copy?.hint ?? '')}
      </p>
    </li>
  )
}
