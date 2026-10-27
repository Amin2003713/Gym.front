'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { bulkAssignPlan } from '../_api/assignment-api'
import type { BulkAssignmentResponse } from '../_model/assignment.types'
import type { PlanSummary } from '../../Plans/_model/plan.types'

export function BulkAssignDialog({ open, onOpenChange, plans, onAssigned }: { open: boolean; onOpenChange: (open: boolean) => void; plans: PlanSummary[]; onAssigned: () => void }) {
  const [planId, setPlanId] = useState('')
  const [memberIds, setMemberIds] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<BulkAssignmentResponse | null>(null)
  useEffect(() => { if (open) { setPlanId(plans.find(p => !p.isArchived)?.id ?? ''); setMemberIds(''); setResult(null) } }, [open, plans])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ids = [...new Set(memberIds.split(/[\n,;\s]+/).map(x => x.trim()).filter(Boolean))]
    if (!planId) return toast.error('برنامه را انتخاب کنید')
    if (!ids.length) return toast.error('حداقل شناسه یک شاگرد را وارد کنید')
    if (ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) return toast.error('تمام شناسه‌ها باید GUID معتبر باشند')
    setSaving(true)
    try { const r = await bulkAssignPlan(planId, { memberIds: ids, startDate }); setResult(r); toast.success('درخواست تخصیص پردازش شد'); onAssigned() }
    catch (e) { toast.error('تخصیص برنامه ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
    finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl" dir="rtl"><DialogHeader><DialogTitle>تخصیص برنامه به شاگردها</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={submit}>
      <label className="block space-y-1 text-sm"><span>برنامه</span><select className="h-10 w-full rounded-md border bg-background px-3" value={planId} onChange={e => setPlanId(e.target.value)} required><option value="">انتخاب برنامه</option>{plans.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.title} ({p.visibility})</option>)}</select></label>
      <label className="block space-y-1 text-sm"><span>شناسه شاگردها (GUID، با خط جدید یا کاما جدا کنید)</span><textarea className="min-h-28 w-full rounded-md border bg-background p-3 font-mono text-sm" dir="ltr" value={memberIds} onChange={e => setMemberIds(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required /></label>
      <label className="block space-y-1 text-sm"><span>تاریخ شروع</span><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></label>
      {result && <div className="rounded-lg border p-3 text-sm"><p className="mb-2 font-semibold">نتیجه: {result.members.length} شاگرد</p>{result.members.map(m => <div key={m.memberId} className="flex justify-between gap-3 border-t py-2"><span className="font-mono text-xs" dir="ltr">{m.memberId}</span><span>{m.error ? `خطا: ${m.error}` : m.status ?? 'ثبت شد'}</span></div>)}</div>}
      <DialogFooter><Button type="submit" disabled={saving}>{saving ? 'در حال تخصیص…' : 'تخصیص برنامه'}</Button><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>بستن</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}
