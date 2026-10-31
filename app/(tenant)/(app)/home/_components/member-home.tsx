'use client'

import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Flame,
  Play,
  Scale,
  Timer,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import { getTrainingHome, upsertMeasurement } from '@/app/(tenant)/_api/training-api'
import { getNextSession } from '@/app/(tenant)/_api/workout-api'
import { GamificationSection } from '@/app/(tenant)/_components/gamification/gamification-section'
import { MemberChecklist } from '@/app/(tenant)/_components/onboarding/member-checklist'
import {
  PlanAssignmentStatus,
  type AssignmentListItem,
} from '@/app/(tenant)/_model/assignment.types'
import type {
  MemberHome as MemberHomeData,
  WeeklyActivityDay,
} from '@/app/(tenant)/_model/training.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const WEEKDAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const dateLabel = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(`${iso}T12:00:00`))
    : ''

export function MemberHome() {
  const [home, setHome] = useState<MemberHomeData | null>(null)
  const [assignment, setAssignment] = useState<AssignmentListItem | null>(null)
  const [next, setNext] = useState<{
    dayName?: string
    exercises?: Array<{ exerciseName?: string }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [weight, setWeight] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [overview, assignments] = await Promise.all([
          getTrainingHome(),
          listMyAssignments(PlanAssignmentStatus.Active),
        ])

        if (cancelled) return

        const active = assignments[0] ?? null

        // The next planned day is a separate loader on purpose: Home must still render when the
        // rotation cannot resolve (e.g. an assignment without sessions left).
        const planned = active
          ? await getNextSession(active.id).catch(() => null)
          : null

        if (cancelled) return

        setHome(overview)
        setAssignment(active)
        setNext(planned)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت اطلاعات خانه ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [version])

  const reload = () => {
    setLoading(true)
    setVersion((current) => current + 1)
  }

  const saveWeight = async () => {
    const value = Number(weight.replace(',', '.'))
    if (!home || !Number.isFinite(value) || value <= 0) return

    setSavingWeight(true)

    try {
      await upsertMeasurement({ date: home.today, weightKg: value })
      setWeight('')
      toast.success('وزن امروز ثبت شد')
      reload()
    } catch (error) {
      toast.error('ثبت وزن ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSavingWeight(false)
    }
  }

  if (loading && !home) return <HomeSkeleton />

  const progress = assignment
    ? Math.round(
        (assignment.completedSessions / Math.max(1, assignment.totalSessions)) * 100,
      )
    : 0

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">{dateLabel(home?.today)}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">امروز چه خبر؟</h1>
      </header>

      <section className="from-primary text-primary-foreground relative overflow-hidden rounded-2xl bg-gradient-to-br to-emerald-700 p-5 shadow-sm">
        <div className="pointer-events-none absolute -top-10 -left-8 size-36 rounded-full bg-white/10 blur-2xl" />

        {assignment ? (
          <div className="relative space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold opacity-90">
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                {assignment.plan?.plan.title ?? 'برنامه فعال'}
              </span>
            </div>
            <div>
              <p className="text-xs opacity-90">جلسه بعدی</p>
              <h2 className="mt-1 text-xl font-extrabold">
                {next?.dayName ?? `روز ${fa(assignment.completedSessions + 1)}`}
              </h2>
              <p className="mt-1 text-sm opacity-90">
                {next?.exercises?.length
                  ? `${fa(next.exercises.length)} حرکت`
                  : `${fa(assignment.completedSessions)} از ${fa(assignment.totalSessions)} جلسه`}
              </p>
            </div>

            <div className="space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white/90" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] opacity-90">
                {fa(progress)}٪ برنامه کامل شده
              </p>
            </div>

            <Button asChild size="lg" className="w-full bg-white text-emerald-800 hover:bg-white/90">
              <Link href="/workout">
                <Play className="size-4" />
                شروع تمرین
              </Link>
            </Button>
          </div>
        ) : (
          <div className="relative space-y-3">
            <h2 className="text-lg font-extrabold">هنوز برنامه فعالی نداری</h2>
            <p className="text-sm leading-6 opacity-90">
              یک تمرین آزاد شروع کن یا از کتابخانه حرکت انتخاب کن؛ مربی هم می‌تواند برایت برنامه
              بگذارد.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg" className="bg-white text-emerald-800 hover:bg-white/90">
                <Link href="/workout">
                  <Play className="size-4" />
                  تمرین آزاد
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="border border-white/40 text-primary-foreground hover:bg-white/10"
              >
                <Link href="/library">کتابخانه حرکات</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      <MemberChecklist />

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="bg-card rounded-2xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-warning/15 text-warning flex size-9 items-center justify-center rounded-xl">
                <Flame className="size-5" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">زنجیره تمرین</p>
                <p className="text-lg font-extrabold">
                  {fa(home?.currentStreakDays ?? 0)} روز
                </p>
              </div>
            </div>
            <Trophy className="text-muted-foreground/50 size-5" />
          </div>

          <WeekStrip week={home?.week ?? []} />
        </section>

        <section className="bg-card rounded-2xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-primary/12 text-primary flex size-9 items-center justify-center rounded-xl">
                <Scale className="size-5" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">وزن من</p>
                <p className="text-lg font-extrabold">
                  {home?.latestMeasurement?.weightKg
                    ? `${fa(Number(home.latestMeasurement.weightKg))} کیلو`
                    : 'ثبت نشده'}
                </p>
              </div>
            </div>
            <span className="text-muted-foreground text-[11px]">
              {home?.latestMeasurement?.date
                ? dateLabel(home.latestMeasurement.date)
                : 'امروز ثبت کن'}
            </span>
          </div>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void saveWeight()
            }}
          >
            <input
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="وزن امروز (kg)"
              aria-label="وزن امروز به کیلوگرم"
              className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
            />
            <Button type="submit" size="sm" disabled={savingWeight || !weight}>
              ثبت
            </Button>
          </form>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatTile
          icon={<Dumbbell className="size-4" />}
          label="جلسه این هفته"
          value={fa(home?.sessionsThisWeek ?? 0)}
        />
        <StatTile
          icon={<Timer className="size-4" />}
          label="حجم این هفته"
          value={`${fa(Math.round(home?.volumeThisWeekKg ?? 0))} kg`}
        />
      </div>

      <GamificationSection />

      <div className="grid grid-cols-2 gap-2">
        {[
          { href: '/muscles', label: 'عضلات' },
          { href: '/stats', label: 'آمار' },
          { href: '/structural-balance', label: 'تعادل ساختاری' },
          { href: '/measurements', label: 'اندازه‌گیری' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-card hover:border-primary/40 rounded-xl border py-3 text-center text-xs font-semibold transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <Link
        href="/plan"
        className="bg-card hover:border-primary/40 flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold transition-colors"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="text-primary size-4" />
          برنامه تمرینی من
        </span>
        <ArrowLeft className="text-muted-foreground size-4" />
      </Link>
    </div>
  )
}

function WeekStrip({ week }: { week: WeeklyActivityDay[] }) {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1">
      {week.map((day, index) => (
        <div key={day.date} className="flex flex-col items-center gap-1">
          <span className="text-muted-foreground text-[10px]">{WEEKDAY_LABELS[index]}</span>
          <span
            aria-label={`${day.sessions} جلسه`}
            className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${
              day.sessions > 0
                ? 'bg-primary text-primary-foreground'
                : day.isToday
                  ? 'border-primary text-primary border-2'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {day.sessions > 0 ? fa(day.sessions) : day.isFuture ? '' : '·'}
          </span>
        </div>
      ))}
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-card rounded-2xl border p-4 shadow-sm">
      <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
        {icon}
      </span>
      <p className="text-muted-foreground mt-2 text-xs">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  )
}
