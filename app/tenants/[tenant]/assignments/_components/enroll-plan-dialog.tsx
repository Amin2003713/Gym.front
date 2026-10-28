'use client'

import { useState } from 'react'


import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'

import type { PlanSummary } from '../../plans/_model/plan.types'
import { enrollInPlan } from '../_api/assignment-api'


interface EnrollPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plans: PlanSummary[]
  onEnrolled: () => void
}

export function EnrollPlanDialog({
  open,
  onOpenChange,
  plans,
  onEnrolled,
}: EnrollPlanDialogProps) {
  const [planId, setPlanId] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!planId) {
      toast.error('برنامه را انتخاب کنید')
      return
    }
    setSaving(true)
    try {
      await enrollInPlan(planId)
      toast.success('ثبت‌نام انجام شد')
      onOpenChange(false)
      onEnrolled()
    } catch (e) {
      toast.error('ثبت‌نام در برنامه ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ثبت‌نام در برنامه عمومی</DialogTitle>
        </DialogHeader>
        <label className="block space-y-1 text-sm">
          <span>برنامه</span>
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          >
            <option value="">انتخاب برنامه</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title} · {plan.level}
              </option>
            ))}
          </select>
        </label>
        <DialogFooter>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? 'در حال ثبت‌نام…' : 'ثبت‌نام'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
