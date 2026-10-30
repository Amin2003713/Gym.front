'use client'

import { useEffect, useState } from 'react'

import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import { useGetUsers } from '@/app/(tenant)/_api/use-get-users'
import type { PlanSummary } from '../../plans/_model/plan.types'
import { bulkAssignPlan } from '@/app/(tenant)/_api/assignment-api'
import type { BulkAssignmentResponse } from '@/app/(tenant)/_model/assignment.types'

import MemberPicker, { type MemberPickerSelection } from './member-picker'
import MemberBodyMapPanel from './member-body-map-panel'

interface SelectedMember {
  id: string
  name: string
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  plans,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: PlanSummary[];
  onAssigned: () => void;
}) {
  const { users } = useGetUsers()
  const [planId, setPlanId] = useState('')
  const [members, setMembers] = useState<SelectedMember[]>([])
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<BulkAssignmentResponse | null>(null)

  const nameOf = (id: string) => users.find((u) => u.id === id)?.label ?? id

  useEffect(() => {
    if (open) {
      setPlanId(plans.find((p) => !p.isArchived)?.id ?? '')
      setMembers([])
      setResult(null)
    }
  }, [open, plans])

  const addMember = (selection: MemberPickerSelection) => {
    setMembers((current) =>
      current.some((m) => m.id === selection.id) ? current : [...current, selection],
    )
  }

  const removeMember = (id: string) =>
    setMembers((current) => current.filter((m) => m.id !== id))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planId) return toast.error('برنامه را انتخاب کنید')
    if (!members.length) return toast.error('حداقل یک شاگرد را انتخاب کنید')
    setSaving(true)
    try {
      const r = await bulkAssignPlan(planId, {
        memberIds: members.map((m) => m.id),
        startDate,
      })
      setResult(r)
      toast.success('درخواست تخصیص پردازش شد')
      onAssigned()
    } catch (e) {
      toast.error('تخصیص برنامه ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>تخصیص برنامه به شاگردها</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block space-y-1 text-sm">
            <span>برنامه</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              required
            >
              <option value="">انتخاب برنامه</option>
              {plans
                .filter((p) => !p.isArchived)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
          </label>

          <div className="space-y-1 text-sm">
            <span>شاگردها</span>
            <MemberPicker onSelect={(sel) => { if (sel) addMember(sel) }} placeholder="افزودن شاگرد از فهرست اعضا…" />
            {members.length > 0 && (
              <ul className="mt-2 space-y-1">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 truncate font-medium">{m.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`حذف ${m.name}`}
                      onClick={() => removeMember(m.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {[...new Set(members.map((m) => m.id))].length === 1 ? (
            <MemberBodyMapPanel
              memberId={members[0].id}
              memberName={members[0].name}
            />
          ) : (
            <p className="text-muted-foreground rounded-lg bg-muted/40 p-3 text-xs">
              برای نمایش نقشه بدن یک عضو، ابتدا فقط یک شاگرد را در فهرست نگه دارید یا اولین شاگرد را انتخاب کنید.
            </p>
          )}

          <label className="block space-y-1 text-sm">
            <span>تاریخ شروع</span>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>

          {result && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="mb-2 font-semibold">نتیجه: {result.members.length} شاگرد</p>
              {result.members.map((m) => (
                <div key={m.memberId} className="flex justify-between gap-3 border-t py-2">
                  <span className="min-w-0 truncate">{nameOf(m.memberId)}</span>
                  <span>{m.error ? `خطا: ${m.error}` : m.status ?? 'ثبت شد'}</span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'در حال تخصیص…' : 'تخصیص برنامه'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              بستن
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
