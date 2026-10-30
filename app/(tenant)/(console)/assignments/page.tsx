'use client'

import { RefreshCw, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserRoles } from '@/hooks/use-user-roles'
import { toast } from '@/lib/toast'

import { listMyPlans, listPublicPlans } from '../plans/_api/plan-api'
import type { PlanSummary } from '../plans/_model/plan.types'

import {
  changeAssignmentStatus,
  listCoachAssignments,
  listMyAssignments,
} from '@/app/(tenant)/_api/assignment-api'
import { AssignmentTable } from './_components/assignment-table'
import { BulkAssignDialog } from './_components/bulk-assign-dialog'
import { EnrollPlanDialog } from './_components/enroll-plan-dialog'
import type {
  AssignmentListItem,
  CoachAssignmentItem,
  PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'


const statusLabel: Record<PlanAssignmentStatus, string> = {
  Active: 'فعال',
  Paused: 'متوقف',
  Completed: 'تکمیل‌شده',
  Cancelled: 'لغوشده',
}

export default function AssignmentsPage() {
  const { canManage, isTraineeOnly } = useUserRoles()

  const [items, setItems] = useState<(CoachAssignmentItem | AssignmentListItem)[]>([])
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [coachView, setCoachView] = useState(canManage)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assignments, myPlans, publicPlans] = await Promise.all([
        coachView
          ? listCoachAssignments({
              status: status as PlanAssignmentStatus | '',
              searchString: search || undefined,
            })
          : listMyAssignments(status as PlanAssignmentStatus | ''),
        listMyPlans(),
        listPublicPlans({ pageSize: 20 }),
      ])
      const rows = coachView
        ? ((assignments as { results?: CoachAssignmentItem[] }).results ?? [])
        : (assignments as AssignmentListItem[])
      setItems(rows)
      const publicRows = Array.isArray(publicPlans) ? publicPlans : [...publicPlans.items ?? [], ...publicPlans.results ?? []]
      const merged = new Map<string, PlanSummary>()
      ;[...(Array.isArray(myPlans) ? myPlans : []), ...publicRows].forEach((plan) =>
        merged.set(plan.id, plan),
      )
      setPlans([...merged.values()])
    } catch (e) {
      toast.error('دریافت تخصیص‌ها ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setLoading(false)
    }
  }, [coachView, status, search])

  useEffect(() => {
    void load()
  }, [load])

  const publicPlans = useMemo(() => plans.filter((plan) => plan.visibility === 'Public' && !plan.isArchived), [plans])

  const changeStatus = async (
    item: CoachAssignmentItem | AssignmentListItem,
    next: 'Active' | 'Paused' | 'Cancelled',
  ) => {
    const id = ('assignmentId' in item && item.assignmentId) || item.id
    if (!window.confirm(`وضعیت تخصیص به ${statusLabel[next]} تغییر کند؟`)) return
    try {
      await changeAssignmentStatus(id, next)
      toast.success('وضعیت تخصیص تغییر کرد')
      await load()
    } catch (e) {
      toast.error('تغییر وضعیت ناموفق بود؛ در صورت تعارض، فهرست را تازه کنید.', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
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
          <p className="mt-1 text-sm text-muted-foreground">
            {isTraineeOnly
              ? 'برنامه‌های تخصیص‌یافته مربی و ثبت‌نام در برنامه‌های عمومی'
              : 'مدیریت برنامه شاگردها و پیگیری پیشرفت جلسات'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          {coachView && (
            <Button onClick={() => setAssignOpen(true)}>
              <UserPlus className="ml-2 size-4" />
              تخصیص گروهی
            </Button>
          )}
          {!coachView && (
            <Button onClick={() => setEnrollOpen(true)}>ثبت‌نام در برنامه عمومی</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>فهرست تخصیص‌ها</CardTitle>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <>
                <Button
                  variant={coachView ? 'default' : 'outline'}
                  onClick={() => setCoachView(true)}
                >
                  تخصیص‌های شاگردها
                </Button>
                <Button
                  variant={!coachView ? 'default' : 'outline'}
                  onClick={() => setCoachView(false)}
                >
                  تخصیص‌های من
                </Button>
              </>
            )}
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {coachView && (
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                placeholder="جستجوی شاگرد"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AssignmentTable items={items} loading={loading} coachView={coachView} onChangeStatus={changeStatus} />
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
