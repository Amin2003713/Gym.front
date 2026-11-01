'use client'

import { Archive, Download, Eye, Pencil, Plus, RefreshCw, Search, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppLocale } from '@/hooks/use-app-locale'
import { useUserRoles } from '@/hooks/use-user-roles'
import { toast } from '@/lib/toast'

import {
  archivePlan,
  downloadPlanPdf,
  getPlan,
  listMyPlans,
  listPublicPlans,
} from './_api/plan-api'
import { PlanDetailDialog } from './_components/plan-detail-dialog'
import { GOAL_LABELS, LEVEL_LABELS } from './_model/plan-labels'
import type {
  PlanDetail,
  PlanGoal,
  PlanLevel,
  PlanSummary,
} from './_model/plan.types'
import { PlanDurationType, PlanVisibility } from './_model/plan.types'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

export default function PlansPage() {
  const { canManage, isTraineeOnly, isAdmin, isTrainer } = useUserRoles()
  const locale = useAppLocale()
  const router = useRouter()
  const requestSequence = useRef(0)

  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catalog, setCatalog] = useState(isTraineeOnly)
  const [goal, setGoal] = useState<PlanGoal | ''>('')
  const [level, setLevel] = useState<PlanLevel | ''>('')
  const [detail, setDetail] = useState<PlanDetail | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const goalText = useCallback(
    (value: PlanGoal) => GOAL_LABELS[value]?.[locale] ?? String(value),
    [locale],
  )
  const levelText = useCallback(
    (value: PlanLevel) => LEVEL_LABELS[value]?.[locale] ?? String(value),
    [locale],
  )

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
        const result = await listPublicPlans({
          goal,
          level,
          cursor,
          pageSize: 20,
        })
        if (sequence !== requestSequence.current) return

        const rows = Array.isArray(result)
          ? [...result]
          : [...(result.items ?? result.results ?? [])]

        setPlans((current) => {
          if (!cursor) return rows
          const seen = new Set(current.map((item) => item.id))
          return [...current, ...rows.filter((item) => !seen.has(item.id))]
        })
        setNextCursor(Array.isArray(result) ? null : (result.nextCursor ?? null))
      }
    } catch (error) {
      if (sequence === requestSequence.current)
        toast.error('دریافت برنامه‌ها ناموفق بود', {
          description: error instanceof Error ? error.message : 'خطای ناشناخته',
        })
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [catalog, cursor, goal, level])

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return plans

    return plans.filter((plan) =>
      `${plan.title} ${goalText(plan.goal)} ${levelText(plan.level)} ${plan.visibility}`
        .toLocaleLowerCase()
        .includes(term),
    )
  }, [goalText, levelText, plans, search])

  const filtersActive = clauseHasValue(goal) || clauseHasValue(level) || !!search.trim()

  const showCreate = () => router.push('/plans/new')

  const showEdit = (plan: PlanSummary) => router.push(`/plans/${plan.id}/edit`)

  const downloadPdf = async (plan: PlanSummary) => {
    try {
      await downloadPlanPdf(plan.id, plan.title)
    } catch (error) {
      toast.error('دریافت PDF ناموفق بود', {
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
      })
    }
  }

  const showDetail = async (plan: PlanSummary) => {
    try {
      setDetail(await getPlan(plan.id))
    } catch (error) {
      toast.error('دریافت جزئیات ناموفق بود', {
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
      })
    }
  }

  const doArchive = async (plan: PlanSummary) => {
    if (!window.confirm(`برنامه «${plan.title}» بایگانی شود؟`)) return

    try {
      await archivePlan(plan.id)
      toast.success('برنامه بایگانی شد')
      await load()
    } catch (error) {
      toast.error('بایگانی برنامه ناموفق بود', {
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
      })
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">برنامه‌های تمرینی</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {canManage
              ? 'ساخت، مدیریت و مرور برنامه‌های تمرینی'
              : 'مرور برنامه‌های عمومی و برنامه‌های تخصیص‌یافته به شما'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          {canManage && (
            <Button onClick={showCreate}>
              <Plus className="size-4" />
              برنامه جدید
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" asChild>
              <a href="/assignments">
                <UserPlus className="size-4" />
                تخصیص در بخش تخصیص‌ها
              </a>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              فهرست برنامه‌ها
              <span className="text-muted-foreground text-xs font-normal" aria-live="polite">
                {fa(filtered.length)} برنامه
              </span>
            </CardTitle>

            {canManage && (
              <div className="flex gap-1 rounded-lg border p-1" role="tablist" aria-label="منبع برنامه‌ها">
                <Button
                  size="sm"
                  role="tab"
                  aria-selected={catalog}
                  variant={catalog ? 'default' : 'ghost'}
                  onClick={() => {
                    setCatalog(true)
                    setCursor(null)
                  }}
                >
                  کاتالوگ عمومی
                </Button>
                <Button
                  size="sm"
                  role="tab"
                  aria-selected={!catalog}
                  variant={!catalog ? 'default' : 'ghost'}
                  onClick={() => {
                    setCatalog(false)
                    setCursor(null)
                  }}
                >
                  برنامه‌های من
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1 sm:max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                className="pe-9"
                placeholder="جستجوی عنوان…"
                aria-label="جستجوی برنامه"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {catalog && (
              <>
                <select
                  className="bg-background h-10 rounded-md border px-3 text-sm"
                  aria-label={locale === 'en' ? 'Goal' : 'هدف'}
                  value={goal}
                  onChange={(event) => {
                    setGoal(event.target.value === '' ? '' : (Number(event.target.value) as PlanGoal))
                    setCursor(null)
                  }}
                >
                  <option value="">{locale === 'en' ? 'All goals' : 'همه هدف‌ها'}</option>
                  {Object.keys(GOAL_LABELS).map((value) => (
                    <option key={value} value={value}>
                      {goalText(Number(value) as PlanGoal)}
                    </option>
                  ))}
                </select>

                <select
                  className="bg-background h-10 rounded-md border px-3 text-sm"
                  aria-label={locale === 'en' ? 'Level' : 'سطح'}
                  value={level}
                  onChange={(event) => {
                    setLevel(
                      event.target.value === '' ? '' : (Number(event.target.value) as PlanLevel),
                    )
                    setCursor(null)
                  }}
                >
                  <option value="">{locale === 'en' ? 'All levels' : 'همه سطح‌ها'}</option>
                  {Object.keys(LEVEL_LABELS).map((value) => (
                    <option key={value} value={value}>
                      {levelText(Number(value) as PlanLevel)}
                    </option>
                  ))}
                </select>
              </>
            )}

            {filtersActive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearch('')
                  setGoal('')
                  setLevel('')
                  setCursor(null)
                }}
              >
                <X className="size-4" />
                {locale === 'en' ? 'Clear' : 'پاک کردن'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading && plans.length === 0 ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="bg-muted/50 h-12 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              {search.trim() || filtersActive
                ? 'برنامه‌ای با این فیلترها پیدا نشد.'
                : 'هنوز برنامه‌ای ثبت نشده است.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <caption className="sr-only">فهرست برنامه‌های تمرینی</caption>
                <thead>
                  <tr className="text-muted-foreground border-b text-right">
                    {[
                      'عنوان',
                      locale === 'en' ? 'Goal' : 'هدف',
                      locale === 'en' ? 'Level' : 'سطح',
                      'مدت',
                      'دسترسی',
                      'نسخه',
                      'وضعیت',
                      'عملیات',
                    ].map((header) => (
                      <th key={header} scope="col" className="p-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((plan) => (
                    <tr key={plan.id} className="hover:bg-muted/30 border-b last:border-0">
                      <td className="p-3 font-medium">{plan.title}</td>
                      <td className="p-3">{goalText(plan.goal)}</td>
                      <td className="p-3">{levelText(plan.level)}</td>
                      <td className="p-3 tabular-nums">
                        {plan.durationType === PlanDurationType.Sessions
                          ? `${fa(plan.totalSessions ?? 0)} جلسه`
                          : `${fa(plan.durationWeeks ?? 0)} هفته`}
                      </td>
                      <td className="p-3">
                        <Badge variant={plan.visibility === PlanVisibility.Public ? 'default' : 'secondary'}>
                          {plan.visibility === PlanVisibility.Public ? 'عمومی' : 'خصوصی'}
                        </Badge>
                      </td>
                      <td className="p-3 tabular-nums">{fa(plan.currentVersion)}</td>
                      <td className="p-3">
                        <Badge variant={plan.isArchived ? 'secondary' : 'outline'}>
                          {plan.isArchived ? 'بایگانی' : 'فعال'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="جزئیات"
                            aria-label={`جزئیات ${plan.title}`}
                            onClick={() => void showDetail(plan)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="دانلود PDF"
                            aria-label={`دانلود PDF ${plan.title}`}
                            onClick={() => void downloadPdf(plan)}
                          >
                            <Download className="size-4" />
                          </Button>
                          {canManage && !catalog && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="ویرایش"
                                aria-label={`ویرایش ${plan.title}`}
                                disabled={plan.isArchived}
                                onClick={() => showEdit(plan)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="بایگانی"
                                aria-label={`بایگانی ${plan.title}`}
                                disabled={plan.isArchived}
                                onClick={() => void doArchive(plan)}
                              >
                                <Archive className="text-destructive size-4" />
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
              <Button
                variant="outline"
                onClick={() => setCursor(nextCursor)}
                disabled={loading}
              >
                {loading ? 'در حال بارگذاری…' : locale === 'en' ? 'Load more' : 'نمایش بیشتر'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {detail && <PlanDetailDialog plan={detail} onClose={() => setDetail(null)} />}

      <p className="text-muted-foreground text-xs leading-5">
        مالک و مربی: ساخت، ویرایش، بایگانی و تخصیص. شاگرد: مشاهده کاتالوگ عمومی و برنامه‌های
        خود.
        {isTrainer ? ' برنامه‌های شما فقط توسط خودتان و مدیر قابل ویرایش است.' : ''}
      </p>
    </div>
  )
}

function clauseHasValue(value: string | number) {
  return String(value).trim().length > 0
}
