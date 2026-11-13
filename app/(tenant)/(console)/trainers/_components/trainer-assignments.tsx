'use client'

import { ShieldCheck, UserRound } from '@/components/icons'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/lib/toast'

import { assignTrainerToMember, listMembers } from '../_api/trainer-api'

export interface TrainerAssignmentFormProps {
  memberId: string
  onAssignmentChange?: () => void
}

type TrainerOption = { id: string; displayName: string }

/** Lets an admin or senior trainer attach a trainer to one member. */
export function TrainerAssignmentForm({ memberId, onAssignmentChange }: TrainerAssignmentFormProps) {
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const rows = await listMembers({ role: 'Trainer' })
      if (cancelled) return
      setTrainers(
        rows
          .filter((user) => user.isActive)
          .map((user) => ({ id: user.id, displayName: user.displayName || user.email || user.id })),
      )
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const assign = useCallback(async () => {
    if (!selectedTrainerId) {
      toast.error('یک مربی انتخاب کنید')
      return
    }

    setSaving(true)
    try {
      await assignTrainerToMember({ memberId, trainerId: selectedTrainerId })
      toast.success('مربی به شاگرد منتسب شد')
      setSelectedTrainerId('')
      onAssignmentChange?.()
    } catch (error) {
      toast.error('انتساب مربی ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }, [memberId, onAssignmentChange, selectedTrainerId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          انتساب مربی
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground text-sm">در حال دریافت مربی‌ها…</p>
        ) : trainers.length === 0 ? (
          <p className="text-muted-foreground text-sm">مربی فعالی یافت نشد.</p>
        ) : (
          <>
            <div className="grid gap-2">
              <label htmlFor="assign-trainer" className="text-sm font-medium">
                مربی
              </label>
              <select
                id="assign-trainer"
                value={selectedTrainerId}
                onChange={(event) => setSelectedTrainerId(event.target.value)}
                className="bg-background h-10 rounded-md border px-3 text-sm"
              >
                <option value="">انتخاب مربی…</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <UserRound className="me-1 size-3" />
                شاگرد: {memberId.slice(0, 8)}…
              </Badge>
            </div>

            <Button onClick={() => void assign()} disabled={saving || !selectedTrainerId} className="w-full">
              {saving ? 'در حال انتساب…' : 'انتساب مربی به شاگرد'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
