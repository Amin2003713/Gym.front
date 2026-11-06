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
} from '@/components/icons'
import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { listCoachAssignments } from '@/app/(tenant)/_api/assignment-api'
import { listCoachConversations } from '@/app/(tenant)/_api/coach-api'
import {
  PlanAssignmentStatus,
  type CoachAssignmentItem,
} from '@/app/(tenant)/_model/assignment.types'
import {
  CoachConversationKind,
  CoachConversationStatus,
  type CoachConversationSummary,
} from '@/app/(tenant)/_model/coach'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardModeCard, DashboardPanel, DashboardStat } from '@/features/gym/components/dashboard-kit'
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
 * straight into the training app (`/home`) to run the gym as a member would.
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
    <main dir="rtl" className="mx-auto w-full min-w-0 max-w-[1440px] space-y-5">
      <section className="bg-card relative overflow-hidden rounded-2xl border p-4 shadow-sm sm:p-7">
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
              <Link href="/home">
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
          <DashboardStat
            label="درخواست‌های باز"
            value={fa(openRequests.length)}
            detail="منتظر پاسخ مربی"
            icon={Inbox}
            tone="orange"
          />
          <DashboardStat
            label="برنامه‌های فعال"
            value={fa(activeAssignments.length)}
            detail={`از ${fa(assignments.length)} تخصیص`}
            icon={Dumbbell}
            tone="blue"
          />
          <DashboardStat
            label="اعضای در حال تمرین"
            value={fa(members.length)}
            detail="دارای برنامه تخصیص‌یافته"
            icon={Users}
          />
          <DashboardStat
            label="جلسه‌های تکمیل‌شده"
            value={fa(completedSessions)}
            detail="جمع جلسات ثبت‌شده اعضا"
            icon={TrendingUp}
            tone="green"
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
        <DashboardPanel
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
        </DashboardPanel>

        <DashboardPanel title="حالت‌های کاری" description="جابه‌جایی بین مدیریت باشگاه و تمرین">
          <div className="grid gap-2">
            <DashboardModeCard
              href="/home"
              icon={Play}
              title="حالت تمرین باشگاه"
              detail="ورود به تجربه عضو: شروع جلسه، ثبت ست و برنامه‌های من"
              active
            />
            <DashboardModeCard
              href="/console/coach"
              icon={Inbox}
              title="پاسخ به اعضا"
              detail="گفتگوهای درخواست مربی"
            />
            <DashboardModeCard
              href="/trainers"
              icon={Users}
              title="شاگردان و پیشرفت"
              detail="گزارش پیشرفت و ریکاوری اعضا"
            />
            {isAdmin && (
              <DashboardModeCard
                href="/users"
                icon={ShieldCheck}
                title="مدیریت کاربران"
                detail="نقش‌ها، دسترسی و حساب‌ها"
              />
            )}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
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
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{member.name}</span>
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
      </DashboardPanel>

      <p className="text-muted-foreground flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs">
        <CheckCircle2 className="text-primary size-4" />
        {isTrainer && !isAdmin
          ? 'دسترسی مربی: مدیریت برنامه‌ها، شاگردان و پاسخ به درخواست‌ها.'
          : 'دسترسی مدیر: همه بخش‌ها به‌همراه مدیریت کاربران و تنظیمات باشگاه.'}
      </p>
    </main>
  )
}
