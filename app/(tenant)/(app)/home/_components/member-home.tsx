'use client'

import {
  Activity,
  CalendarDays,
  Dumbbell,
  Flame,
  Play,
  Scale,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import { getTrainingHome, upsertMeasurement } from '@/app/(tenant)/_api/training-api'
import { getNextSession } from '@/app/(tenant)/_api/workout-api'
import { GamificationSection } from '@/app/(tenant)/_components/gamification/gamification-section'
import { MemberChecklist } from '@/app/(tenant)/_components/onboarding/member-checklist'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import {
  PlanAssignmentStatus,
  type AssignmentListItem,
  type AssignmentPlanDay,
} from '@/app/(tenant)/_model/assignment.types'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import type {
  MemberHome as MemberHomeData,
  WeeklyActivityDay,
} from '@/app/(tenant)/_model/training.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardModeCard,
  DashboardPanel,
  DashboardStat,
} from '@/features/gym/components/dashboard-kit'
import { muscleLoad } from '@/lib/muscle-mapping'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const WEEKDAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

/** Most muscles a coach dashboard ever needs to list; the map already shows the rest. */
const MUSCLE_LIST_LIMIT = 8

const dateLabel = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(`${iso}T12:00:00`))
    : ''

/**
 * The member dashboard. It uses the same shell as the staff console - hero, one row of stat tiles,
 * then panels - and its body map is live: it shades the muscles the next planned day actually
 * works, taken from that day's exercises.
 */
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
        const planned = active ? await getNextSession(active.id).catch(() => null) : null

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

  /** The day the rotation will open next: completed sessions modulo the plan's days. */
  const nextDay: AssignmentPlanDay | null = useMemo(() => {
    const days = assignment?.plan?.days ?? []
    if (!days.length) return null

    return days[(assignment?.completedSessions ?? 0) % days.length] ?? null
  }, [assignment])

  const targetLoad = useMemo(() => (nextDay ? muscleLoad(nextDay.exercises) : {}), [nextDay])

  const muscles = useMemo(
    () =>
      Object.entries(targetLoad)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MUSCLE_LIST_LIMIT),
    [targetLoad],
  )

  if (loading && !home) return <HomeSkeleton />

  const progress = assignment
    ? Math.round((assignment.completedSessions / Math.max(1, assignment.totalSessions)) * 100)
    : 0

  return (
    <div className="space-y-5">
      <section className="bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-7">
        <div className="bg-primary/10 pointer-events-none absolute -top-16 -left-10 size-48 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
              <Activity className="size-3.5" />
              {dateLabel(home?.today) || 'امروز'}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              امروز چه خبر؟
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-7">
              {assignment
                ? `برنامه «${assignment.plan?.plan.title ?? 'برنامه فعال'}» در حال اجراست. جلسه بعدی را شروع کن یا نگاهی به نقشه عضلانی و پیشرفت هفته بینداز.`
                : 'هنوز برنامه فعالی نداری؛ یک تمرین آزاد شروع کن یا از کتابخانه حرکت انتخاب کن. مربی هم می‌تواند برایت برنامه بگذارد.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/workout">
                <Play className="size-4" />
                {assignment ? 'شروع جلسه بعدی' : 'تمرین آزاد'}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/plan">
                <CalendarDays className="size-4" />
                برنامه‌های من
              </Link>
            </Button>
          </div>
        </div>

        {assignment && (
          <div className="relative mt-5 space-y-1">
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-[11px]">
              {fa(assignment.completedSessions)} از {fa(assignment.totalSessions)} جلسه ·{' '}
              {fa(progress)}٪
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="زنجیره تمرین"
          value={`${fa(home?.currentStreakDays ?? 0)} روز`}
          detail="روزهای پیوسته با تمرین ثبت‌شده"
          icon={Flame}
          tone="orange"
        />
        <DashboardStat
          label="جلسه این هفته"
          value={fa(home?.sessionsThisWeek ?? 0)}
          detail="از شنبه تا امروز"
          icon={Dumbbell}
          tone="blue"
        />
        <DashboardStat
          label="حجم این هفته"
          value={`${fa(Math.round(home?.volumeThisWeekKg ?? 0))} kg`}
          detail="مجموع وزنه × تکرار"
          icon={Timer}
          tone="green"
        />
        <DashboardStat
          label="وزن من"
          value={
            home?.latestMeasurement?.weightKg
              ? `${fa(Number(home.latestMeasurement.weightKg))} kg`
              : 'ثبت نشده'
          }
          detail={
            home?.latestMeasurement?.date
              ? `آخرین ثبت ${dateLabel(home.latestMeasurement.date)}`
              : 'امروز وزن را ثبت کن'
          }
          icon={Scale}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
        <DashboardPanel
          title="نقشه عضلانی جلسه بعدی"
          description={
            nextDay
              ? `${nextDay.name} · ${fa(nextDay.exercises.length)} حرکت`
              : 'عضلاتی که تمرین بعدی درگیر می‌کند'
          }
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/stats">آمار کامل</Link>
            </Button>
          }
        >
          {muscles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="text-muted-foreground size-7" />
              <p className="text-sm font-semibold">نقشه‌ای برای نمایش نیست</p>
              <p className="text-muted-foreground max-w-sm text-xs leading-6">
                وقتی جلسه بعدی حرکات مشخصی داشته باشد، عضلات هدفش همین‌جا رنگ می‌گیرند.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:items-center">
              <BodyMapPanel body="male" palette="load" load={targetLoad} />

              <ul className="space-y-2">
                {muscles.map(([slug, value]) => {
                  const percent = Math.round(
                    (value / Math.max(1, muscles[0]?.[1] ?? 1)) * 100,
                  )

                  return (
                    <li key={slug} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{MUSCLE_LABEL[slug] ?? slug}</span>
                        <span className="text-muted-foreground tabular-nums">{fa(percent)}٪</span>
                      </div>
                      <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </DashboardPanel>

        <div className="space-y-5">
          <DashboardPanel title="هفته من" description="جلسه‌های ثبت‌شده در هفت روز گذشته">
            <WeekStrip week={home?.week ?? []} />
            <div className="mt-4 border-t pt-4">
              <p className="text-muted-foreground text-xs">وزن امروز</p>
              <form
                className="mt-2 flex gap-2"
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
            </div>
          </DashboardPanel>

          <DashboardPanel title="میان‌برها" description="بخش‌های پرکاربرد تمرین">
            <div className="grid gap-2">
              <DashboardModeCard
                href="/stats"
                icon={Trophy}
                title="آمار تمرین"
                detail="روند قدرت، حجم و رکوردها"
              />
              <DashboardModeCard
                href="/measurements"
                icon={Scale}
                title="اندازه‌گیری بدن"
                detail="ثبت وزن، دورها و علائم حیاتی"
              />
              <DashboardModeCard
                href="/muscles"
                icon={Users}
                title="عضلات و تعادل"
                detail="سهم هر عضله و تعادل ساختاری"
              />
            </div>
          </DashboardPanel>
        </div>
      </div>

      <MemberChecklist />

      <GamificationSection />

      <DashboardPanel title="برنامه تمرینی" description="روزهای برنامه و شروع هر جلسه">
        {next ? (
          <p className="text-muted-foreground text-sm leading-6">
            جلسه بعدی: <span className="text-foreground font-semibold">{next.dayName ?? '—'}</span>
            {next.exercises?.length ? ` · ${fa(next.exercises.length)} حرکت` : ''}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm leading-6">
            برنامه فعالی برای نمایش نیست.
          </p>
        )}

        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href="/plan">
            <CalendarDays className="size-4" />
            مشاهده برنامه
          </Link>
        </Button>
      </DashboardPanel>
    </div>
  )
}

function WeekStrip({ week }: { week: WeeklyActivityDay[] }) {
  return (
    <div className="grid grid-cols-7 gap-1">
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

function HomeSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
