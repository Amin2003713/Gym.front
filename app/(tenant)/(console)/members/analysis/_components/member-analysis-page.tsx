'use client'

import Link from 'next/link'
import { Activity, RefreshCw, Search, Shuffle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import {
  listCoachAssignments,
  bulkAssignPlan,
} from '@/app/(tenant)/_api/assignment-api'
import type {
  CoachAssignmentItem,
  PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'
import { listMyPlans, listPublicPlans } from '../../../plans/_api/plan-api'
import type { PlanSummary } from '../../../plans/_model/plan.types'

const statusLabel: Record<PlanAssignmentStatus, string> = {
  Active: 'فعال',
  Paused: 'متوقف',
  Completed: 'تکمیل‌شده',
  Cancelled: 'لغوشده',
}

interface MemberRow {
  memberId: string
  name: string
  email?: string | null
  current?: CoachAssignmentItem
  history: CoachAssignmentItem[]
}

export function MemberAnalysisPage() {
  const [loads, setLoads] = useState<CoachAssignmentItem[]>([])
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [changeTarget, setChangeTarget] = useState<MemberRow | null>(null)
  const [newPlanId, setNewPlanId] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assignments, myPlans, publicPlans] = await Promise.all([
        listCoachAssignments({ pageNumber: 1, pageSize: 200 }),
        listMyPlans(),
        listPublicPlans({ pageSize: 20 }),
      ])
      const rows = (assignments as { results?: CoachAssignmentItem[] })
        .results ?? []
      setLoads(rows)
      const publicRows = Array.isArray(publicPlans)
        ? publicPlans
        : [...(publicPlans.items ?? []), ...(publicPlans.results ?? [])]
      const merged = new Map<string, PlanSummary>()
      ;[...(Array.isArray(myPlans) ? myPlans : []), ...publicRows].forEach(
        (plan) => merged.set(plan.id, plan),
      )
      setPlans([...merged.values()])
    } catch (e) {
      toast.error('دریافت تحلیل شاگردها ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const rows = useMemo<MemberRow[]>(() => {
    const map = new Map<string, MemberRow>()
    const order: Record<PlanAssignmentStatus, number> = {
      Active: 0,
      Paused: 1,
      Completed: 2,
      Cancelled: 3,
    }
    loads.forEach((a) => {
      const existing = map.get(a.memberId)
      if (!existing) {
        map.set(a.memberId, {
          memberId: a.memberId,
          name: a.memberName || a.memberId,
          email: a.memberEmail,
          current: a,
          history: [a],
        })
        return
      }
      existing.history.push(a)
      const current = existing.current
      if (
        !current ||
        order[a.status] < order[current.status] ||
        (a.status === current.status &&
          new Date(a.startDate) > new Date(current.startDate))
      ) {
        existing.current = a
      }
    })
    const all = [...map.values()]
    return search.trim()
      ? all.filter((row) =>
          `${row.name} ${row.email ?? ''}`
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase().trim()),
        )
      : all
  }, [loads, search])

  const stats = useMemo(() => {
    const byStatus = (status: PlanAssignmentStatus) =>
      rows.filter((row) => row.current?.status === status).length
    const withProgress = rows.filter(
      (row) => row.current && row.current.totalSessions > 0,
    )
    const avg = withProgress.length
      ? Math.round(
          withProgress.reduce(
            (sum, row) =>
              sum + row.current!.completedSessions / row.current!.totalSessions,
            0,
          ) / withProgress.length * 100,
        )
      : 0
    return {
      total: rows.length,
      active: byStatus('Active'),
      paused: byStatus('Paused') + byStatus('Cancelled'),
      completed: byStatus('Completed'),
      avg,
    }
  }, [rows])

  const openChange = (row: MemberRow) => {
    setChangeTarget(row)
    setNewPlanId(plans.find((plan) => !plan.isArchived)?.id ?? '')
    setStartDate(new Date().toISOString().slice(0, 10))
  }

  const submitChange = async () => {
    if (!changeTarget) return
    if (!newPlanId) {
      toast.error('برنامه جدید را انتخاب کنید')
      return
    }
    setSaving(true)
    try {
      await bulkAssignPlan(newPlanId, {
        memberIds: [changeTarget.memberId],
        startDate,
      })
      toast.success('برنامه جدید برای شاگرد تخصیص یافت')
      setChangeTarget(null)
      await load()
    } catch (e) {
      toast.error('تغییر برنامه ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">تحلیل شاگردها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            وضعیت برنامه و پیشرفت هر شاگرد، با امکان تغییر سریع برنامه
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button variant="outline" asChild>
            <Link href="/assignments">
              <Shuffle className="ml-2 size-4" />
              مدیریت تخصیص‌ها
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'کل شاگردها', value: stats.total },
          { label: 'برنامه فعال', value: stats.active },
          { label: 'متوقف/لغو', value: stats.paused },
          { label: 'تکمیل‌شده', value: stats.completed },
          { label: 'میانگین پیشرفت', value: `${stats.avg}٪` },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>وضعیت شاگردها</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-9"
              placeholder="جستجوی شاگرد"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              در حال دریافت وضعیت شاگردها…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              شاگردی با برنامه تخصیص‌یافته پیدا نشد.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((row) => {
                const current = row.current
                const progress =
                  current && current.totalSessions > 0
                    ? Math.round(
                        (current.completedSessions / current.totalSessions) * 100,
                      )
                    : 0
                return (
                  <div
                    key={row.memberId}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{row.name}</p>
                        {row.email && (
                          <p className="text-muted-foreground truncate text-xs">
                            {row.email}
                          </p>
                        )}
                      </div>
                      {current ? (
                        <Badge
                          variant={
                            current.status === 'Active'
                              ? 'default'
                              : current.status === 'Completed'
                                ? 'outline'
                                : 'secondary'
                          }
                        >
                          {statusLabel[current.status]}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">بدون برنامه</Badge>
                      )}
                    </div>

                    {current ? (
                      <>
                        <p className="mt-3 text-sm">
                          برنامه:{' '}
                          <span className="font-medium">
                            {current.planTitle || '—'}
                          </span>
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground shrink-0 text-xs">
                            {current.completedSessions}/{current.totalSessions}(
                            {progress}٪)
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          شروع: {current.startDate?.slice(0, 10) || '—'}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground mt-3 text-sm">
                        هنوز برنامه‌ای به این شاگرد تخصیص نیافته‌اید.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openChange(row)}>
                        <Activity className="ml-1 size-4" />
                        {current ? 'تغییر برنامه' : 'تخصیص برنامه'}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={`/assignments?member=${encodeURIComponent(row.memberId)}`}
                        >
                          پیگیری جلسات
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!changeTarget} onOpenChange={(open) => !open && setChangeTarget(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              تغییر برنامه — {changeTarget?.name ?? ''}
            </DialogTitle>
          </DialogHeader>
          {changeTarget?.current && (
            <p className="text-muted-foreground text-sm">
              برنامه فعلی: {changeTarget.current.planTitle || '—'} (
              {statusLabel[changeTarget.current.status]})
            </p>
          )}
          <label className="block space-y-1 text-sm">
            <span>برنامه جدید</span>
            <select
              className="bg-background h-10 w-full rounded-md border px-3"
              value={newPlanId}
              onChange={(e) => setNewPlanId(e.target.value)}
            >
              <option value="">انتخاب برنامه</option>
              {plans
                .filter((plan) => !plan.isArchived)
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} ({plan.visibility === 'Public' ? 'عمومی' : 'خصوصی'})
                  </option>
                ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>تاریخ شروع</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <DialogFooter>
            <Button onClick={() => void submitChange()} disabled={saving}>
              {saving ? 'در حال تخصیص…' : 'تخصیص برنامه جدید'}
            </Button>
            <Button variant="outline" onClick={() => setChangeTarget(null)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
