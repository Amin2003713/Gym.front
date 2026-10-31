'use client'

import {
  ArrowUpLeft,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Inbox,
  LayoutDashboard,
  Play,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { listCoachAssignments } from '@/app/(tenant)/_api/assignment-api'
import { listCoachConversations } from '@/app/(tenant)/_api/coach-api'
import {
  CoachConversationKind,
  CoachConversationStatus,
  type CoachConversationSummary,
} from '@/app/(tenant)/_model/coach'
import {
  PlanAssignmentStatus,
  type CoachAssignmentItem,
} from '@/app/(tenant)/_model/assignment.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserRoles } from '@/hooks/use-user-roles'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const activityFmt = new Intl.DateTimeFormat('fa-IR', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * One dashboard for every staff role: the layout is identical, only the number of
 * management shortcuts changes with the signed-in role. Admins and trainers can jump
 * straight into the training app (`/workouts`) to run the gym as a member would.
 */
export function StaffDashboard() {
  const { isAdmin, isTrainer } = useUserRoles()
  const [assignments, setAssignments] = useState<CoachAssignmentItem[]>([])
  const [requests, setRequests] = useState<CoachConversationSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Two independent, bounded requests: a failing queue must not blank the dashboard.
    void Promise.allSettled([
      listCoachAssignments({ pageSize: 60 }),
      listCoachConversations(),
    ]).then(([assignmentResult, conversationResult]) => {
      if (cancelled) return

      if (assignmentResult.status === 'fulfilled')
        setAssignments(assignmentResult.value.results ?? [])

      if (conversationResult.status === 'fulfilled')
        setRequests(
          conversationResult.value.filter(
            (row) => row.kind === CoachConversationKind.Human,
          ),
        )

      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const openRequests = useMemo(
    () =>
      requests
        .filter((row) => row.status === CoachConversationStatus.Open)
        .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')),
    [requests],
  )

  const activeAssignments = useMemo(
    () => assignments.filter((row) => row.status === PlanAssignmentStatus.Active),
    [assignments],
  )

  const completedSessions = useMemo(
    () => assignments.reduce((sum, row) => sum + (row.completedSessions ?? 0), 0),
    [assignments],
  )

  const members = useMemo(() => {
    const map = new Map<string, { name: string; completed: number; total: number }>()

    for (const row of assignments) {
      const id = row.memberId ?? row.member?.userId
      if (!id) continue

      const current = map.get(id) ?? {
        name:
          `${row.member?.firstName ?? ''} ${row.member?.lastName ?? ''}`.trim() ||
          'عضو باشگاه',
        completed: 0,
        total: 0,
      }

      map.set(id, {
        name: current.name,
        completed: current.completed + (row.completedSessions ?? 0),
        total: current.total + Math.max(row.completedSessions ?? 0, row.totalSessions ?? 0),
      })
    }

    return [...map.entries()]
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 6)
  }, [assignments])

  return (
    <main dir="rtl" className="mx-auto w-full max-w-[1440px] space-y-5">
      <section className="bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-7">
        <div className="bg-primary/10 pointer-events-none absolute -top-16 -left-10 size-48 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
              {isAdmin ? (
                <ShieldCheck className="size-3.5" />
              ) : (
                <LayoutDashboard className="size-3.5" />
              )}
              {isAdmin ? 'پنل مدیریت باشگاه' : 'پنل مربی'}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isAdmin ? 'باشگاه امروز' : 'میز کار مربی'}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-7">
              درخواست‌های اعضا، شاگردان و وضعیت برنامه‌ها در یک نگاه. هر وقت خواستید با
              «حالت تمرین» وارد تجربه‌ی تمرین شوید و مثل یک عضو باشگاه تمرین کنید.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/workouts">
                <Play className="size-4" />
                حالت تمرین
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/console/coach">
                <Inbox className="size-4" />
                صف مربی
                {openRequests.length > 0 && (
                  <span className="bg-primary text-primary-foreground ms-1 rounded-full px-1.5 text-[10px] font-bold">
                    {fa(openRequests.length)}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="درخواست‌های باز"
            value={fa(openRequests.length)}
            detail="منتظر پاسخ مربی"
            icon={Inbox}
            tone="orange"
          />
          <Stat
            label="برنامه‌های فعال"
            value={fa(activeAssignments.length)}
            detail={`از ${fa(assignments.length)} تخصیص`}
            icon={Dumbbell}
            tone="blue"
          />
          <Stat
            label="اعضای در حال تمرین"
            value={fa(members.length)}
            detail="دارای برنامه تخصیص‌یافته"
            icon={Users}
          />
          <Stat
            label="جلسه‌های تکمیل‌شده"
            value={fa(completedSessions)}
            detail="جمع جلسات ثبت‌شده اعضا"
            icon={TrendingUp}
            tone="green"
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
        <Panel
          title="درخواست‌های اعضا از مربی"
          description="بازترین درخواست‌ها؛ پاسخ در همان صفحه بدون ترک پنل"
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/console/coach">
                همه درخواست‌ها <ArrowUpLeft className="size-4" />
              </Link>
            </Button>
          }
        >
          {openRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Inbox className="text-muted-foreground size-7" />
              <p className="text-sm font-semibold">صف خالی است</p>
              <p className="text-muted-foreground max-w-sm text-xs leading-6">
                وقتی عضوی درخواست بازبینی برنامه بفرستد، همین‌جا و در صف مربی دیده
                می‌شود.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {openRequests.slice(0, 5).map((request) => (
                <li key={request.id}>
                  <Link
                    href="/console/coach"
                    className="hover:border-primary/40 hover:bg-primary/5 flex items-start gap-3 rounded-xl border p-3 transition-colors"
                  >
                    <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Inbox className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {request.memberName || 'عضو باشگاه'}
                      </span>
                      <span className="text-muted-foreground mt-1 block truncate text-xs">
                        {request.title}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {request.lastMessageAt
                        ? activityFmt.format(new Date(request.lastMessageAt))
                        : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="حالت‌های کاری" description="جابه‌جایی بین مدیریت باشگاه و تمرین">
          <div className="grid gap-2">
            <ModeCard
              href="/workouts"
              icon={Play}
              title="حالت تمرین باشگاه"
              detail="شروع جلسه، ثبت ست و همان تجربه‌ای که اعضا می‌بینند"
              active
            />
            <ModeCard
              href="/console/coach"
              icon={Inbox}
              title="پاسخ به اعضا"
              detail="گفتگوهای درخواست مربی"
            />
            <ModeCard
              href="/trainers"
              icon={Users}
              title="شاگردان و پیشرفت"
              detail="گزارش پیشرفت و ریکاوری اعضا"
            />
            {isAdmin && (
              <ModeCard
                href="/users"
                icon={ShieldCheck}
                title="مدیریت کاربران"
                detail="نقش‌ها، دسترسی و حساب‌ها"
              />
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="شاگردان"
        description="پیشرفت جلسه‌های ثبت‌شده"
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/trainers">
              جزئیات شاگردان <ArrowUpLeft className="size-4" />
            </Link>
          </Button>
        }
      >
        {members.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            هنوز برنامه‌ای به عضوی تخصیص نداده‌اید.
          </p>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => {
              const percent = Math.round(
                (member.completed / Math.max(1, member.total)) * 100,
              )

              return (
                <li key={member.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{member.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {fa(member.completed)} / {fa(member.total)} · {fa(percent)}٪
                    </span>
                  </div>
                  <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <p className="text-muted-foreground flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs">
        <CheckCircle2 className="text-primary size-4" />
        {isTrainer && !isAdmin
          ? 'دسترسی مربی: مدیریت برنامه‌ها، شاگردان و پاسخ به درخواست‌ها.'
          : 'دسترسی مدیر: همه بخش‌ها به‌همراه مدیریت کاربران و تنظیمات باشگاه.'}
      </p>
    </main>
  )
}

function Stat({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: 'primary' | 'green' | 'orange' | 'blue'
}) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  }[tone]

  return (
    <div className="bg-card rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
        </div>
        <span className={`flex size-11 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">{detail}</p>
    </div>
  )
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function ModeCard({
  href,
  icon: Icon,
  title,
  detail,
  active = false,
}: {
  href: string
  icon: LucideIcon
  title: string
  detail: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        active
          ? 'border-primary/40 bg-primary/5'
          : 'hover:border-primary/40 hover:bg-muted/50'
      }`}
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted-foreground mt-1 block text-xs leading-5">{detail}</span>
      </span>
      <CalendarDays className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}
