'use client'

import { Archive, Eye, Plus, RefreshCw, Search, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'


import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUserRoles } from '@/hooks/use-user-roles'
import { toast } from '@/lib/toast'
import { useAppLocale } from '@/hooks/use-app-locale'

import { archivePlan, getPlan, listMyPlans, listPublicPlans } from './_api/plan-api'
import { PlanFormDialog } from './_components/plan-form-dialog'
import type { PlanDetail, PlanGoal, PlanLevel, PlanSummary } from './_model/plan.types'

const goalLabels: Record<PlanGoal, string> = {
  GetStronger: 'افزایش قدرت',
  BuildMuscle: 'عضله‌سازی',
  LoseWeight: 'کاهش وزن',
  Endurance: 'استقامت',
  Fitness: 'تناسب اندام',
  Mobility: 'تحرک',
}
const levelLabels: Record<PlanLevel, string> = {
  Beginner: 'مبتدی',
  Intermediate: 'متوسط',
  Advanced: 'پیشرفته',
}

export default function PlansPage() {
  const { canManage, isTraineeOnly, isAdmin, isTrainer } = useUserRoles()
  const locale = useAppLocale()
  const requestSequence = useRef(0)

  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catalog, setCatalog] = useState(isTraineeOnly)
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PlanSummary | null>(null)
  const [detail, setDetail] = useState<PlanDetail | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current
    setLoading(true)
    try {
      if (!catalog) {
        const result = await listMyPlans(1, 30)
        if (sequence !== requestSequence.current) return
        setPlans(Array.isArray(result) ? result : [])
        setNextCursor(null)
      } else {
        const result = await listPublicPlans({ goal: goal as never, level: level as never, cursor, pageSize: 20 })
        if (sequence !== requestSequence.current) return
        const rows = Array.isArray(result) ? [...result] : [...(result.items ?? result.results ?? [])]
        setPlans(current => {
          if (!cursor) return rows
          const seen = new Set(current.map(item => item.id))
          return [...current, ...rows.filter(item => !seen.has(item.id))]
        })
        setNextCursor(Array.isArray(result) ? null : result.nextCursor ?? null)
      }
    } catch (e) {
      if (sequence === requestSequence.current) toast.error('دریافت برنامه‌ها ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' })
    } finally { if (sequence === requestSequence.current) setLoading(false) }
  }, [catalog, goal, level, cursor])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () =>
      plans.filter((plan) =>
        `${plan.title} ${plan.goal} ${plan.level} ${plan.visibility}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase().trim()),
      ),
    [plans, search],
  )

  const showCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const showEdit = (plan: PlanSummary) => {
    setEditing(plan)
    setDialogOpen(true)
  }
  const showDetail = async (plan: PlanSummary) => {
    try {
      setDetail(await getPlan(plan.id))
    } catch (e) {
      toast.error('دریافت جزئیات ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    }
  }
  const doArchive = async (plan: PlanSummary) => {
    if (!window.confirm(`برنامه «${plan.title}» بایگانی شود؟`)) return
    try {
      await archivePlan(plan.id)
      toast.success('برنامه بایگانی شد')
      await load()
    } catch (e) {
      toast.error('بایگانی برنامه ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">برنامه‌های تمرینی</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? 'ساخت، مدیریت و مرور برنامه‌های تمرینی'
              : 'مرور برنامه‌های عمومی و برنامه‌های تخصیص‌یافته به شما'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          {canManage && (
            <Button onClick={showCreate}>
              <Plus className="ml-2 size-4" />
              برنامه جدید
            </Button>
          )}
          {isAdmin && <Button variant="outline"><UserPlus className="ml-2 size-4" /> تخصیص در بخش تخصیص‌ها</Button>}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>فهرست برنامه‌ها</CardTitle>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <>
                <Button
                  variant={catalog ? 'default' : 'outline'}
                  onClick={() => {
                    setCatalog(true)
                    setCursor(null)
                  }}
                >
                  کاتالوگ عمومی
                </Button>
                <Button
                  variant={!catalog ? 'default' : 'outline'}
                  onClick={() => {
                    setCatalog(false)
                    setCursor(null)
                  }}
                >
                  برنامه‌های من
                </Button>
              </>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="جستجوی عنوان"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {catalog && (
              <>
                <select
                  className="h-10 rounded-md border bg-background px-3"
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value)
                    setCursor(null)
                  }}
                >
                  <option value="">{locale === 'en' ? 'All goals' : 'همه هدف‌ها'}</option>
                  {Object.entries(goalLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {locale === 'en' ? ({ GetStronger: 'Strength', BuildMuscle: 'Muscle gain', LoseWeight: 'Weight loss', Endurance: 'Endurance', Fitness: 'Fitness', Mobility: 'Mobility' } as const)[value as PlanGoal] : label}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border bg-background px-3"
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value)
                    setCursor(null)
                  }}
                >
                  <option value="">{locale === 'en' ? 'All levels' : 'همه سطح‌ها'}</option>
                  {Object.entries(levelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {locale === 'en' ? ({ Beginner: 'Beginner', Intermediate: 'Intermediate', Advanced: 'Advanced' } as const)[value as PlanLevel] : label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">در حال دریافت برنامه‌ها…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">برنامه‌ای پیدا نشد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead>
                  <tr className="border-b text-right text-muted-foreground">
                    {['عنوان', 'هدف', 'سطح', 'مدت', 'دسترسی', 'نسخه', 'وضعیت', 'عملیات'].map((header) => (
                      <th key={header} className="p-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((plan) => (
                    <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{plan.title}</td>
                      <td className="p-3">{locale === 'en' ? ({ GetStronger: 'Strength', BuildMuscle: 'Muscle gain', LoseWeight: 'Weight loss', Endurance: 'Endurance', Fitness: 'Fitness', Mobility: 'Mobility' } as const)[plan.goal] : goalLabels[plan.goal]}</td>
                      <td className="p-3">{locale === 'en' ? ({ Beginner: 'Beginner', Intermediate: 'Intermediate', Advanced: 'Advanced' } as const)[plan.level] : levelLabels[plan.level]}</td>
                      <td className="p-3">
                        {plan.durationType === 'Sessions'
                          ? `${plan.totalSessions ?? '—'} جلسه`
                          : `${plan.durationWeeks ?? '—'} هفته`}
                      </td>
                      <td className="p-3">
                        <Badge variant={plan.visibility === 'Public' ? 'default' : 'secondary'}>
                          {plan.visibility === 'Public' ? 'عمومی' : 'خصوصی'}
                        </Badge>
                      </td>
                      <td className="p-3">{plan.currentVersion}</td>
                      <td className="p-3">
                        <Badge variant={plan.isArchived ? 'secondary' : 'outline'}>
                          {plan.isArchived ? 'بایگانی' : 'فعال'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" title="جزئیات" onClick={() => void showDetail(plan)}>
                            <Eye className="size-4" />
                          </Button>
                          {canManage && !catalog && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="ویرایش"
                                disabled={plan.isArchived}
                                onClick={() => showEdit(plan)}
                              >
                                <Plus className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="بایگانی"
                                disabled={plan.isArchived}
                                onClick={() => void doArchive(plan)}
                              >
                                <Archive className="size-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {catalog && nextCursor && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setCursor(nextCursor)} disabled={loading}>
                {locale === 'en' ? 'Load more' : 'نمایش بیشتر'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <PlanFormDialog
          open={dialogOpen}
          plan={editing}
          onOpenChange={setDialogOpen}
          onSaved={() => void load()}
        />
      )}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{detail.title}</h2>
              <Button variant="outline" onClick={() => setDetail(null)}>
                بستن
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{detail.description || 'بدون توضیحات'}</p>
            {detail.days.map((day) => (
              <div key={day.dayNumber} className="mb-3 rounded-lg border p-3">
                <h3 className="font-semibold">
                  {day.dayNumber}. {day.name}
                </h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  {day.exercises.map((exercise) => (
                    <li key={exercise.id}>
                      {exercise.exerciseName || exercise.exerciseId} — {exercise.targetSets ?? '—'} ست ×{' '}
                      {exercise.targetRepsMin ?? '—'}–{exercise.targetRepsMax ?? '—'} تکرار
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        مالک و مربی: ساخت/ویرایش/بایگانی و تخصیص. شاگرد: مشاهده کاتالوگ عمومی و برنامه‌های خود.
        {isTrainer ? '' : ''}
      </p>
    </div>
  )
}
