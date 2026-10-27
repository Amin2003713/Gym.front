'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, Eye, Plus, RefreshCw, Search } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanFormDialog } from './_component/plan-form-dialog'
import { archivePlan, getPlan, listMyPlans, listPublicPlans } from './_api/plan-api'
import type { PlanDetail, PlanGoal, PlanLevel, PlanSummary } from './_model/plan.types'

const goalLabels: Record<PlanGoal, string> = { GetStronger: 'افزایش قدرت', BuildMuscle: 'عضله‌سازی', LoseWeight: 'کاهش وزن', Endurance: 'استقامت', Fitness: 'تناسب اندام', Mobility: 'تحرک' }
const levelLabels: Record<PlanLevel, string> = { Beginner: 'مبتدی', Intermediate: 'متوسط', Advanced: 'پیشرفته' }

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catalog, setCatalog] = useState(false)
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PlanSummary | null>(null)
  const [detail, setDetail] = useState<PlanDetail | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (!catalog) {
        const result = await listMyPlans()
        setPlans(Array.isArray(result) ? result : [])
        setNextCursor(null)
      } else {
        const result = await listPublicPlans({ goal: goal as never, level: level as never, cursor, pageSize: 20 })
        const rows = Array.isArray(result) ? result : result.items ?? result.results ?? []
        setPlans(rows)
        setNextCursor(Array.isArray(result) ? null : result.nextCursor ?? null)
      }
    } catch (e) { toast.error('دریافت برنامه‌ها ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
    finally { setLoading(false) }
  }, [catalog, goal, level, cursor])

  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => plans.filter(p => `${p.title} ${p.goal} ${p.level} ${p.visibility}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim())), [plans, search])
  const showCreate = () => { setEditing(null); setDialogOpen(true) }
  const showEdit = (p: PlanSummary) => { setEditing(p); setDialogOpen(true) }
  const showDetail = async (p: PlanSummary) => {
    try { setDetail(await getPlan(p.id)) } catch (e) { toast.error('دریافت جزئیات ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
  }
  const doArchive = async (p: PlanSummary) => {
    if (!window.confirm(`برنامه «${p.title}» بایگانی شود؟`)) return
    try { await archivePlan(p.id); toast.success('برنامه بایگانی شد'); await load() }
    catch (e) { toast.error('بایگانی برنامه ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
  }

  return <div className="space-y-5" dir="rtl">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div><h1 className="text-2xl font-bold">برنامه‌های تمرینی</h1><p className="mt-1 text-sm text-muted-foreground">ساخت، مدیریت و مرور برنامه‌های تمرینی</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`} />بروزرسانی</Button><Button onClick={showCreate}><Plus className="ml-2 size-4" />برنامه جدید</Button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">تعداد نمایش‌داده‌شده</p><p className="mt-1 text-2xl font-bold">{plans.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">برنامه‌های عمومی</p><p className="mt-1 text-2xl font-bold">{plans.filter(p => p.visibility === 'Public' && !p.isArchived).length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">برنامه‌های بایگانی‌شده</p><p className="mt-1 text-2xl font-bold">{plans.filter(p => p.isArchived).length}</p></CardContent></Card></div>
    <Card><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <CardTitle>فهرست برنامه‌ها</CardTitle>
      <div className="flex flex-wrap gap-2">
        <Button variant={catalog ? 'default' : 'outline'} onClick={() => { setCatalog(true); setCursor(null) }}>کاتالوگ عمومی</Button><Button variant={!catalog ? 'default' : 'outline'} onClick={() => { setCatalog(false); setCursor(null) }}>برنامه‌های من</Button>
        <div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pr-9" placeholder="جستجوی عنوان" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {catalog && <><select className="h-10 rounded-md border bg-background px-3" value={goal} onChange={e => { setGoal(e.target.value); setCursor(null) }}><option value="">همه هدف‌ها</option>{Object.entries(goalLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select><select className="h-10 rounded-md border bg-background px-3" value={level} onChange={e => { setLevel(e.target.value); setCursor(null) }}><option value="">همه سطح‌ها</option>{Object.entries(levelLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></>}
      </div>
    </CardHeader><CardContent>
      {loading ? <div className="py-12 text-center text-muted-foreground">در حال دریافت برنامه‌ها…</div> : filtered.length === 0 ? <div className="py-12 text-center text-muted-foreground">برنامه‌ای پیدا نشد.</div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b text-right text-muted-foreground">{['عنوان','هدف','سطح','مدت','دسترسی','نسخه','تخصیص فعال','وضعیت','عملیات'].map(x => <th key={x} className="p-3 font-medium">{x}</th>)}</tr></thead><tbody>
          {filtered.map(p => <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30"><td className="p-3 font-medium">{p.title}</td><td className="p-3">{goalLabels[p.goal]}</td><td className="p-3">{levelLabels[p.level]}</td><td className="p-3">{p.durationType === 'Sessions' ? `${p.totalSessions ?? '—'} جلسه` : `${p.durationWeeks ?? '—'} هفته`}</td><td className="p-3"><Badge variant={p.visibility === 'Public' ? 'default' : 'secondary'}>{p.visibility === 'Public' ? 'عمومی' : 'خصوصی'}</Badge></td><td className="p-3">{p.currentVersion}</td><td className="p-3">{p.activeAssignmentCount ?? 0}</td><td className="p-3"><Badge variant={p.isArchived ? 'secondary' : 'outline'}>{p.isArchived ? 'بایگانی' : 'فعال'}</Badge></td><td className="p-3"><div className="flex items-center gap-1"><Button size="icon" variant="ghost" title="جزئیات" onClick={() => void showDetail(p)}><Eye className="size-4" /></Button>{!catalog && <><Button size="icon" variant="ghost" title="ویرایش" disabled={p.isArchived} onClick={() => showEdit(p)}><Plus className="size-4" /></Button><Button size="icon" variant="ghost" title="بایگانی" disabled={p.isArchived} onClick={() => void doArchive(p)}><Archive className="size-4 text-destructive" /></Button></>}</div></td></tr>)}
        </tbody></table></div>}
      {catalog && nextCursor && <div className="mt-4 flex justify-center"><Button variant="outline" onClick={() => setCursor(nextCursor)} disabled={loading}>صفحه بعد</Button></div>}
    </CardContent></Card>
    <PlanFormDialog open={dialogOpen} plan={editing} onOpenChange={setDialogOpen} onSaved={() => void load()} />
    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}><div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-5" onClick={e => e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{detail.title}</h2><Button variant="outline" onClick={() => setDetail(null)}>بستن</Button></div><p className="mb-4 text-sm text-muted-foreground">{detail.description || 'بدون توضیحات'}</p>{detail.days.map(day => <div key={day.dayNumber} className="mb-3 rounded-lg border p-3"><h3 className="font-semibold">{day.dayNumber}. {day.name}</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm">{day.exercises.map(ex => <li key={ex.id}>{ex.exerciseName || ex.exerciseId} — {ex.targetSets ?? '—'} ست × {ex.targetRepsMin ?? '—'}–{ex.targetRepsMax ?? '—'} تکرار</li>)}</ul></div>)}</div></div>}
  </div>
}
