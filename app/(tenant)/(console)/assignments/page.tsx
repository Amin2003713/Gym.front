'use client'

import { RefreshCw, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUserRoles } from '@/hooks/use-user-roles'
import { toast } from '@/lib/toast'

import {
  changeAssignmentStatus,
  listCoachAssignments,
  listMyAssignments,
} from '@/app/(tenant)/_api/assignment-api'
import {
  PlanAssignmentStatus,
  type AssignmentListItem,
  type CoachAssignmentItem,
} from '@/app/(tenant)/_model/assignment.types'

import { AssignmentTable } from './_components/assignment-table'
import { BulkAssignDialog } from './_components/bulk-assign-dialog'
import { EnrollPlanDialog } from './_components/enroll-plan-dialog'
import { listMyPlans, listPublicPlans } from '../plans/_api/plan-api'
import type { PlanSummary } from '../plans/_model/plan.types'

const statusLabel: Record<PlanAssignmentStatus, string> = {
  [PlanAssignmentStatus.Active]: 'فعال',
  [PlanAssignmentStatus.Paused]: 'متوقف',
  [PlanAssignmentStatus.Completed]: 'تکمیل‌شده',
  [PlanAssignmentStatus.Cancelled]: 'لغوشده',
}

const STATUS_ORDER = [
  PlanAssignmentStatus.Active,
  PlanAssignmentStatus.Paused,
  PlanAssignmentStatus.Completed,
  PlanAssignmentStatus.Cancelled,
]

export default function AssignmentsPage() {
  const { canManage, isTraineeOnly } = useUserRoles()

  const [items, setItems] = useState<(CoachAssignmentItem | AssignmentListItem)[]>([])
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [coachView, setCoachView] = useState(canManage)
  const [status, setStatus] = useState<PlanAssignmentStatus | ''>('')
  const [search, setSearch] = useState('')
  // The API is searched with the debounced value, so typing in the box is not a request per key.
  const [searchTerm, setSearchTerm] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(search.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assignments, myPlans, publicPlans] = await Promise.all([
        coachView
          ? listCoachAssignments({ status, searchString: searchTerm || undefined })
          : listMyAssignments(status),
        listMyPlans(),
        listPublicPlans({ pageSize: 20 }),
      ])

      const rows = coachView
        ? ((assignments as { results?: CoachAssignmentItem[] }).results ?? [])
        : (assignments as AssignmentListItem[])

      setItems(rows)

      const publics = Array.isArray(publicPlans)
        ? publicPlans
        : [...(publicPlans.items ?? []), ...(publicPlans.results ?? [])]
      const merged = new Map<string, PlanSummary>()
      ;[...(Array.isArray(myPlans) ? myPlans : []), ...publics].forEach((plan) =>
        merged.set(plan.id, plan),
      )
      setPlans([...merged.values()])
    } catch (error) {
      toast.error('دریافت تخصیص‌ها ناموفق بود', {
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
      })
    } finally {
      setLoading(false)
    }
  }, [coachView, searchTerm, status])

  useEffect(() => {
    void load()
  }, [load])

  const publicPlans = useMemo(
    () => plans.filter((plan) => plan.visibility === 'Public' && !plan.isArchived),
    [plans],
  )

  const counts = useMemo(() => {
    const map = new Map<PlanAssignmentStatus, number>()
    for (const item of items) {
      const value = Number(item.status) as PlanAssignmentStatus
      map.set(value, (map.get(value) ?? 0) + 1)
    }
    return map
  }, [items])

  const changeStatus = async (
    item: CoachAssignmentItem | AssignmentListItem,
    next: PlanAssignmentStatus,
  ) => {
    const id = ('assignmentId' in item && item.assignmentId) || item.id
    if (!window.confirm(`وضعیت تخصیص به «${statusLabel[next]}» تغییر کند؟`)) return

    try {
      await changeAssignmentStatus(id, next)
      toast.success('وضعیت تخصیص تغییر کرد')
      await load()
    } catch (error) {
      toast.error('تغییر وضعیت ناموفق بود؛ در صورت تعارض، فهرست را تازه کنید.', {
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
      })
      await load()
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {isTraineeOnly ? 'برنامه‌های من' : 'تخصیص برنامه‌ها'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isTraineeOnly
              ? 'برنامه‌های تخصیص‌یافته مربی و ثبت‌نام در برنامه‌های عمومی'
              : 'مدیریت برنامه شاگردها، تغییر وضعیت و پیگیری پیشرفت جلسات'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          {coachView ? (
            <Button onClick={() => setAssignOpen(true)}>
              <UserPlus className="size-4" />
              تخصیص گروهی
            </Button>
          ) : (
            <Button onClick={() => setEnrollOpen(true)}>ثبت‌نام در برنامه عمومی</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              فهرست تخصیص‌ها
              <span className="text-muted-foreground text-xs font-normal">
                {items.length.toLocaleString('fa-IR')} مورد
              </span>
            </CardTitle>
            {canManage && (
              <div className="flex gap-1 rounded-lg border p-1" role="tablist" aria-label="دامنه تخصیص‌ها">
                <Button
                  size="sm"
                  role="tab"
                  aria-selected={coachView}
                  variant={coachView ? 'default' : 'ghost'}
                  onClick={() => {
                    setCoachView(true)
                    setStatus('')
                  }}
                >
                  تخصیص‌های شاگردها
                </Button>
                <Button
                  size="sm"
                  role="tab"
                  aria-selected={!coachView}
                  variant={!coachView ? 'default' : 'ghost'}
                  onClick={() => {
                    setCoachView(false)
                    setStatus('')
                  }}
                >
                  تخصیص‌های من
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[{ value: '' as const, label: 'همه' }, ...STATUS_ORDER.map((value) => ({ value, label: statusLabel[value] }))].map(
              (option) => {
                const active = status === option.value
                const count = option.value === '' ? items.length : (counts.get(option.value) ?? 0)

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {option.label}
                    <span className="ms-1 opacity-70">{count.toLocaleString('fa-IR')}</span>
                  </button>
                )
              },
            )}

            {coachView && (
              <div className="relative ms-auto w-full sm:w-64">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جستجوی نام شاگرد یا برنامه…"
                  aria-label="جستجوی تخصیص"
                  className="h-9"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <AssignmentTable
            items={items}
            loading={loading}
            coachView={coachView}
            onChangeStatus={changeStatus}
          />
          {loading && items.length > 0 && (
            <Badge variant="secondary" className="mt-3" aria-live="polite">
              در حال بروزرسانی…
            </Badge>
          )}
        </CardContent>
      </Card>

      {coachView && (
        <BulkAssignDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          plans={plans}
          onAssigned={() => void load()}
        />
      )}

      {!coachView && (
        <EnrollPlanDialog
          open={enrollOpen}
          onOpenChange={setEnrollOpen}
          plans={publicPlans}
          onEnrolled={() => void load()}
        />
      )}
    </div>
  )
}
