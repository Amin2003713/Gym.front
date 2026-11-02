'use client'

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  Lock,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { PlanDetail } from '@/app/(tenant)/(console)/plans/_model/plan.types'
import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import {
  enrollInPlan,
  getPlan,
  listPublicPlanCatalog,
  type PlanSummary,
} from '@/app/(tenant)/_api/member-plan-api'
import { useMuscleBalance } from '@/app/(tenant)/_api/use-muscle-balance'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import {
  PlanAssignmentStatus,
  type AssignmentListItem,
  type AssignmentPlanDay,
} from '@/app/(tenant)/_model/assignment.types'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useConfirm } from '@/lib/confirm'
import { getLocalized } from '@/lib/i18n'
import { muscleLoad } from '@/lib/muscle-mapping'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const GOAL_LABEL: Record<number, string> = {
  0: 'قدرت',
  1: 'عضله‌سازی',
  2: 'کاهش وزن',
  3: 'استقامت',
  4: 'تناسب اندام',
  5: 'انعطاف',
}

const LEVEL_LABEL: Record<number, string> = {
  0: 'مبتدی',
  1: 'متوسط',
  2: 'پیشرفته',
}

const STATUS_LABEL: Record<number, string> = {
  [PlanAssignmentStatus.Active]: 'در حال اجرا',
  [PlanAssignmentStatus.Paused]: 'متوقف',
  [PlanAssignmentStatus.Completed]: 'تمام‌شده',
  [PlanAssignmentStatus.Cancelled]: 'لغو‌شده',
}

const repsLabel = (min?: number | null, max?: number | null) => {
  if (min && max && min !== max) return `${fa(min)}–${fa(max)}`
  return min ? fa(min) : max ? fa(max) : '—'
}

const planMuscleLoad = (days: Array<{ exercises: Array<{ bodyPart?: string | null; target?: string | null; exerciseName?: string | null }> }>) =>
  muscleLoad(
    days.flatMap((day) =>
      day.exercises.map((exercise) => ({
        bodyPart: exercise.bodyPart,
        target: exercise.target,
      })),
    ),
  )

type Tab = 'mine' | 'public'
type MineFilter = 'all' | 'active' | 'done'

/**
 * Plans, split by where they come from: the member's own assignments (active, paused, finished)
 * and the gym's public catalog. Public cards show the muscles the plan trains, mark the plan that
 * best fills the member's under-trained muscles, and only allow enrollment when no active plan has
 * sessions left — with the reason attached to the disabled button.
 */
export function MemberPlan() {
  const [tab, setTab] = useState<Tab>('mine')
  const [mineFilter, setMineFilter] = useState<MineFilter>('all')
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [publicPlans, setPublicPlans] = useState<PlanSummary[]>([])
  const [planLoads, setPlanLoads] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<PlanDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { sessions } = useMuscleBalance()
  const { confirm } = useConfirm()

  const reload = useCallback(async () => {
    setLoading(true)

    try {
      const [rows, catalog] = await Promise.all([
        listMyAssignments(),
        listPublicPlanCatalog(20).catch(() => [] as PlanSummary[]),
      ])

      setAssignments(rows)
      setPublicPlans(catalog)
    } catch (error) {
      toast.error('دریافت برنامه‌ها ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0)
    return () => window.clearTimeout(timer)
  }, [reload])

  // Muscles each public plan trains: the summary has no tree, so details are fetched with a small
  // worker pool and cached for the card maps and the scoring below.
  useEffect(() => {
    if (!publicPlans.length) return

    let alive = true

    void (async () => {
      const queue = [...publicPlans]
      const result: Record<string, Record<string, number>> = {}
      const worker = async () => {
        while (queue.length) {
          const plan = queue.shift()
          if (!plan) continue
          try {
            const full = await getPlan(plan.id)
            result[plan.id] = planMuscleLoad(full.days)
          } catch {
            result[plan.id] = {}
          }
        }
      }

      await Promise.all(Array.from({ length: 4 }, worker))
      if (alive) setPlanLoads(result)
    })()

    return () => {
      alive = false
    }
  }, [publicPlans])

  const activeAssignment = useMemo(
    () =>
      assignments.find(
        (row) =>
          row.status === PlanAssignmentStatus.Active &&
          row.completedSessions < Math.max(1, row.totalSessions),
      ) ?? null,
    [assignments],
  )

  /** What the member has actually trained recently, used to prefer plans for lagging muscles. */
  const recentLoad = useMemo(
    () => muscleLoad(sessions.flatMap((session) => session.exercises ?? [])),
    [sessions],
  )

  const scored = useMemo(() => {
    const rows = publicPlans.map((plan) => {
      const load = planLoads[plan.id] ?? {}
      const muscles = Object.entries(load)

      const score = muscles.reduce(
        (total, [slug, value]) => total + value / (1 + (recentLoad[slug] ?? 0)),
        0,
      )

      const reasonMuscles = muscles
        .map(([slug, value]) => ({
          slug,
          gap: value / (1 + (recentLoad[slug] ?? 0)),
          trained: recentLoad[slug] ?? 0,
        }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 2)
        .filter((item) => item.trained === 0 || item.gap > 0)

      return { plan, score, reasonMuscles }
    })

    const best = rows.slice().sort((a, b) => b.score - a.score)[0]

    return {
      rows,
      bestId: best && best.score > 0 ? best.plan.id : null,
      bestReason:
        best && best.score > 0 && best.reasonMuscles.length
          ? `روی ${best.reasonMuscles
              .map((item) => MUSCLE_LABEL[item.slug] ?? item.slug)
              .join(' و ')} که کمتر تمرین شده‌اند تمرکز دارد.`
          : null,
    }
  }, [planLoads, publicPlans, recentLoad])

  const openDetail = async (planId: string | undefined) => {
    if (!planId) return

    setDetailId(planId)
    setDetail(null)
    setDetailLoading(true)

    try {
      setDetail(await getPlan(planId))
    } catch (error) {
      toast.error('دریافت جزئیات برنامه ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
      setDetailId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const enroll = async (plan: PlanSummary) => {
    const ok = await confirm({
      title: `ثبت‌نام در «${plan.title}»؟`,
      description:
        'برنامه فعال فعلی جایگزین می‌شود؛ تاریخچه و ست‌های ثبت‌شده پاک نمی‌شوند.',
      confirmText: 'ثبت‌نام در برنامه',
    })

    if (!ok) return

    setEnrolling(plan.id)
    try {
      await enrollInPlan(plan.id)
      toast.success('در برنامه ثبت‌نام شدی')
      setTab('mine')
      await reload()
    } catch (error) {
      toast.error('ثبت‌نام در برنامه ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setEnrolling(null)
    }
  }

  const filteredAssignments = assignments.filter((row) => {
    if (mineFilter === 'active') return row.status === PlanAssignmentStatus.Active
    if (mineFilter === 'done')
      return (
        row.status === PlanAssignmentStatus.Completed ||
        row.completedSessions >= Math.max(1, row.totalSessions)
      )
    return true
  })

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">برنامه‌ها</h1>
        <p className="text-muted-foreground text-sm leading-6">
          برنامه‌های خودت و برنامه‌های عمومی باشگاه؛ با نقشه عضلات و پیشنهاد مناسب‌ترین برنامه.
        </p>
      </header>

      <div role="tablist" aria-label="نوع برنامه" className="bg-muted flex gap-1 rounded-full p-1">
        {(
          [
            { key: 'mine', label: 'برنامه‌های من' },
            { key: 'public', label: 'برنامه‌های عمومی' },
          ] as Array<{ key: Tab; label: string }>
        ).map((item) => (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
              tab === item.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'mine' ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: 'all', label: 'همه' },
                { key: 'active', label: 'در حال اجرا' },
                { key: 'done', label: 'تمام‌شده' },
              ] as Array<{ key: MineFilter; label: string }>
            ).map((filter) => (
              <button
                key={filter.key}
                type="button"
                aria-pressed={mineFilter === filter.key}
                onClick={() => setMineFilter(filter.key)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  mineFilter === filter.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
              <CalendarDays className="text-muted-foreground size-7" />
              <p className="text-sm font-bold">برنامه‌ای در این بخش نیست</p>
              <p className="text-muted-foreground max-w-sm text-xs leading-6">
                از تب برنامه‌های عمومی یکی را انتخاب کن، یا از مربی‌ات بخواه برنامه بگذارد.
              </p>
              <Button size="sm" onClick={() => setTab('public')}>
                دیدن برنامه‌های عمومی
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onOpen={() => void openDetail(assignment.planId)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {publicPlans.length === 0 ? (
            <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
              <Sparkles className="text-muted-foreground size-7" />
              <p className="text-sm font-bold">برنامه عمومی‌ای منتشر نشده</p>
              <p className="text-muted-foreground max-w-sm text-xs leading-6">
                به‌زودی برنامه‌های باشگاه همین‌جا نمایش داده می‌شوند.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {scored.rows.map(({ plan }) => {
                const isBest = scored.bestId === plan.id
                const load = planLoads[plan.id] ?? {}
                const blocked = !!activeAssignment
                const blockReason = activeAssignment
                  ? `برنامه «${
                      activeAssignment.plan?.plan.title ??
                      activeAssignment.planTitle ??
                      'فعال'
                    }» هنوز تمام نشده است.`
                  : null

                return (
                  <article
                    key={plan.id}
                    className={`bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors ${
                      isBest ? 'border-primary/50' : 'hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="truncate text-sm font-bold">{plan.title}</h2>
                          {isBest && (
                            <span className="bg-primary/12 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                              <Sparkles className="size-3" aria-hidden />
                              بهترین برای تو
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          {GOAL_LABEL[plan.goal] ?? 'برنامه تمرینی'} ·{' '}
                          {LEVEL_LABEL[plan.level] ?? 'همه'} ·{' '}
                          {plan.durationType === 0
                            ? `${fa(plan.totalSessions ?? 0)} جلسه`
                            : `${fa(plan.durationWeeks ?? 0)} هفته`}
                        </p>
                      </div>
                    </div>

                    {Object.keys(load).length > 0 && (
                      <div className="px-3 pb-1">
                        <BodyMapPanel
                          body="male"
                          palette="load"
                          load={load}
                          size="thumbnail"
                          className="mx-auto max-w-56"
                        />
                      </div>
                    )}

                    {isBest && scored.bestReason && (
                      <p className="text-muted-foreground px-4 pb-2 text-[11px] leading-5">
                        {scored.bestReason}
                      </p>
                    )}

                    <div className="mt-auto flex gap-2 border-t p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openDetail(plan.id)}
                      >
                        جزئیات برنامه
                      </Button>

                      {blocked ? (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0} className="flex-1">
                                <Button size="sm" className="w-full" disabled>
                                  <Lock className="size-3.5" aria-hidden />
                                  ثبت‌نام
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{blockReason}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={enrolling === plan.id}
                          onClick={() => void enroll(plan)}
                        >
                          <CirclePlay className="size-3.5" aria-hidden />
                          {enrolling === plan.id ? 'در حال ثبت‌نام…' : 'ثبت‌نام'}
                        </Button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null)
            setDetail(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail?.title ?? 'جزئیات برنامه'}</DialogTitle>
            <DialogDescription>
              {detail
                ? `${GOAL_LABEL[detail.goal] ?? 'برنامه'} · ${
                    LEVEL_LABEL[detail.level] ?? 'همه'
                  } · ${fa(detail.days.length)} روز`
                : 'در حال دریافت برنامه…'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !detail ? (
            <div className="space-y-2">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : (
            <div className="max-h-[70svh] space-y-4 overflow-y-auto pe-1">
              <section className="rounded-xl border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-bold">عضلاتی که این برنامه پوشش می‌دهد</p>
                <BodyMapPanel body="male" palette="load" load={planMuscleLoad(detail.days)} />
              </section>

              <ol className="space-y-3">
                {detail.days.map((day) => {
                  const load = planMuscleLoad([day])
                  return (
                    <li key={day.id} className="rounded-xl border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-primary text-[11px] font-bold">
                            روز {fa(day.dayNumber)}
                          </p>
                          <h3 className="text-sm font-bold">{day.name}</h3>
                        </div>
                        <span className="text-muted-foreground text-[11px]">
                          {fa(day.exercises.length)} حرکت
                        </span>
                      </div>

                      {Object.keys(load).length > 0 && (
                        <BodyMapPanel
                          body="male"
                          palette="load"
                          load={load}
                          size="thumbnail"
                          className="mx-auto mt-2 max-w-44"
                        />
                      )}

                      <ul className="mt-2 space-y-1.5">
                        {day.exercises.map((exercise) => {
                          const name =
                            getLocalized(exercise, 'exerciseName') ||
                            getLocalized(exercise, 'name') ||
                            'حرکت'
                          const own = muscleLoad([
                            { bodyPart: exercise.bodyPart, target: exercise.target },
                          ])

                          return (
                            <li
                              key={exercise.id}
                              className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                {Object.keys(own).length > 0 && (
                                  <BodyMapPanel
                                    body="male"
                                    palette="load"
                                    load={own}
                                    size="thumbnail"
                                    className="w-10 shrink-0"
                                  />
                                )}
                                <span className="truncate">{name}</span>
                              </span>
                              <span className="text-muted-foreground shrink-0 tabular-nums">
                                {fa(exercise.targetSets)} ×{' '}
                                {repsLabel(exercise.targetRepsMin, exercise.targetRepsMax)}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AssignmentCard({
  assignment,
  onOpen,
}: {
  assignment: AssignmentListItem
  onOpen: () => void
}) {
  const [open, setOpen] = useState(false)
  const title = assignment.plan?.plan.title ?? assignment.planTitle ?? 'برنامه تمرینی'
  const days = assignment.plan?.days ?? []
  const percent = Math.round(
    (assignment.completedSessions / Math.max(1, assignment.totalSessions)) * 100,
  )
  const done =
    assignment.status === PlanAssignmentStatus.Completed ||
    assignment.completedSessions >= Math.max(1, assignment.totalSessions)

  return (
    <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-start"
      >
        <span className="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Target className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-bold">{title}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                done
                  ? 'bg-muted text-muted-foreground'
                  : assignment.status === PlanAssignmentStatus.Paused
                    ? 'bg-warning/10 text-warning'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {done ? 'تمام‌شده' : (STATUS_LABEL[assignment.status] ?? 'در حال اجرا')}
            </span>
          </span>
          <span className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
            <Trophy className="size-3" aria-hidden />
            {fa(assignment.completedSessions)} از {fa(assignment.totalSessions)} جلسه ·{' '}
            {fa(percent)}٪
          </span>
          <span className="bg-muted mt-2 block h-1.5 w-full overflow-hidden rounded-full">
            <span
              className="bg-primary block h-full rounded-full"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </span>
        </span>
        <ChevronDown
          className={`text-muted-foreground size-4 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t p-4">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" disabled={done}>
              <Link href={`/workout?assignment=${encodeURIComponent(assignment.id)}`}>
                <CirclePlay className="size-4" aria-hidden />
                شروع جلسه بعد
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/plan/r/${encodeURIComponent(assignment.id)}`}>
                <CalendarDays className="size-4" aria-hidden />
                روزهای برنامه
              </Link>
            </Button>
            {assignment.planId && (
              <Button size="sm" variant="ghost" onClick={onOpen}>
                نقشه کامل برنامه
              </Button>
            )}
            <span className="text-muted-foreground self-center text-[11px]">
              شروع {assignment.startDate}
            </span>
          </div>

          {days.length === 0 ? (
            <p className="text-muted-foreground text-xs">روزهای این برنامه در دسترس نیست.</p>
          ) : (
            <ol className="space-y-2">
              {days.map((day) => (
                <PlanDayRow key={day.id} day={day} />
              ))}
            </ol>
          )}

          {done && (
            <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" aria-hidden />
              این برنامه تمام شده؛ می‌توانی برنامه عمومی بعدی را انتخاب کنی.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function PlanDayRow({ day }: { day: AssignmentPlanDay }) {
  const load = muscleLoad(
    day.exercises.map((exercise) => ({
      bodyPart: exercise.bodyPart,
      target: exercise.target,
    })),
  )

  return (
    <li className="bg-muted/40 rounded-xl p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <div className="min-w-0">
          <p className="text-xs font-bold">
            روز {fa(day.dayNumber)} · {day.name}
          </p>
          <ul className="mt-2 space-y-1">
            {day.exercises.map((exercise) => (
              <li
                key={exercise.slot.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate">
                  {getLocalized(exercise, 'exerciseName') || 'حرکت'}
                </span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {fa(exercise.slot.targetSets)} ×{' '}
                  {repsLabel(exercise.slot.targetRepsMin, exercise.slot.targetRepsMax)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {Object.keys(load).length > 0 && (
          <div className="border-t pt-2 sm:border-s sm:border-t-0 sm:pt-0 sm:ps-3">
            <p className="text-muted-foreground text-[10px] font-semibold">عضلات این روز</p>
            <BodyMapPanel body="male" palette="load" load={load} size="thumbnail" />
          </div>
        )}
      </div>
    </li>
  )
}
