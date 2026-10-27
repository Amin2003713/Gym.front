'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, UserPlus } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listCoachAssignments, listMyAssignments, changeAssignmentStatus } from './_api/assignment-api'
import { listMyPlans, listPublicPlans } from '../Plans/_api/plan-api'
import { BulkAssignDialog } from './_component/bulk-assign-dialog'
import type { AssignmentListItem, CoachAssignmentItem, PlanAssignmentStatus } from './_model/assignment.types'
import type { PlanSummary } from '../Plans/_model/plan.types'

const statusLabel: Record<PlanAssignmentStatus, string> = { Active: 'فعال', Paused: 'متوقف', Completed: 'تکمیل‌شده', Cancelled: 'لغوشده' }
const statusVariant = (s: PlanAssignmentStatus) => s === 'Active' ? 'default' : s === 'Cancelled' ? 'destructive' : 'secondary'

export default function AssignmentsPage() {
  const [items, setItems] = useState<(CoachAssignmentItem | AssignmentListItem)[]>([])
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [coachView, setCoachView] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, p, pub] = await Promise.all([
        coachView ? listCoachAssignments({ status: status as PlanAssignmentStatus | '' , searchString: search || undefined }) : listMyAssignments(status as PlanAssignmentStatus | ''),
        listMyPlans(),
        listPublicPlans({ pageSize: 20 }),
      ])
      const rows = coachView ? ((a as { results?: CoachAssignmentItem[] }).results ?? []) : (a as AssignmentListItem[])
      setItems(rows)
      const publicRows = Array.isArray(pub) ? pub : pub.items ?? pub.results ?? []
      const merged = new Map<string, PlanSummary>()
      ;[...(Array.isArray(p) ? p : []), ...publicRows].forEach(x => merged.set(x.id, x))
      setPlans([...merged.values()])
    } catch (e) { toast.error('دریافت تخصیص‌ها ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
    finally { setLoading(false) }
  }, [coachView, status, search])
  useEffect(() => { void load() }, [load])

  const changeStatus = async (item: CoachAssignmentItem | AssignmentListItem, next: 'Active' | 'Paused' | 'Cancelled') => {
    const id = ('assignmentId' in item && item.assignmentId) || item.id
    if (!window.confirm(`وضعیت تخصیص به ${statusLabel[next]} تغییر کند؟`)) return
    try { await changeAssignmentStatus(id, next); toast.success('وضعیت تخصیص تغییر کرد'); await load() }
    catch (e) { toast.error('تغییر وضعیت ناموفق بود؛ در صورت تعارض، فهرست را تازه کنید.', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }); await load() }
  }
  return <div className="space-y-5" dir="rtl">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">تخصیص برنامه‌ها</h1><p className="mt-1 text-sm text-muted-foreground">مدیریت برنامه شاگردها و پیگیری پیشرفت جلسات</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`} />بروزرسانی</Button>{coachView && <Button onClick={() => setAssignOpen(true)}><UserPlus className="ml-2 size-4" />تخصیص گروهی</Button>}</div></div>
    <Card><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle>فهرست تخصیص‌ها</CardTitle><div className="flex flex-wrap gap-2"><Button variant={coachView ? 'default' : 'outline'} onClick={() => setCoachView(true)}>تخصیص‌های شاگردها</Button><Button variant={!coachView ? 'default' : 'outline'} onClick={() => setCoachView(false)}>تخصیص‌های من</Button><select className="h-10 rounded-md border bg-background px-3" value={status} onChange={e => setStatus(e.target.value)}><option value="">همه وضعیت‌ها</option>{Object.entries(statusLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select><input className="h-10 rounded-md border bg-background px-3 text-sm" placeholder="جستجوی شاگرد" value={search} onChange={e => setSearch(e.target.value)} /></div></CardHeader><CardContent>
      {loading ? <div className="py-12 text-center text-muted-foreground">در حال دریافت تخصیص‌ها…</div> : !items.length ? <div className="py-12 text-center text-muted-foreground">تخصیصی برای نمایش نیست.</div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b text-right text-muted-foreground">{['برنامه','شاگرد','وضعیت','جلسات','شروع','پایان','عملیات'].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{items.map((item, i) => {
        const coach = item as CoachAssignmentItem
        const s = item.status
        const id = ('assignmentId' in item && item.assignmentId) || item.id
        return <tr key={`${id}-${i}`} className="border-b last:border-0 hover:bg-muted/30"><td className="p-3 font-medium">{coach.planTitle ?? item.planTitle ?? item.planId ?? 'برنامه'}</td><td className="p-3">{coach.memberName ?? coach.memberEmail ?? coach.memberId ?? 'من'}</td><td className="p-3"><Badge variant={statusVariant(s)}>{statusLabel[s] ?? s}</Badge></td><td className="p-3">{item.completedSessions} / {item.totalSessions}</td><td className="p-3" dir="ltr">{item.startDate}</td><td className="p-3" dir="ltr">{item.endDate ?? '—'}</td><td className="p-3"><div className="flex gap-1">{s === 'Active' && <Button size="sm" variant="outline" onClick={() => void changeStatus(item, 'Paused')}>توقف</Button>}{s === 'Paused' && <Button size="sm" variant="outline" onClick={() => void changeStatus(item, 'Active')}>ادامه</Button>}{(s === 'Active' || s === 'Paused') && <Button size="sm" variant="ghost" onClick={() => void changeStatus(item, 'Cancelled')}>لغو</Button>}</div></td></tr>
      })}</tbody></table></div>}
    </CardContent></Card>
    <BulkAssignDialog open={assignOpen} onOpenChange={setAssignOpen} plans={plans} onAssigned={() => void load()} />
  </div>
}
