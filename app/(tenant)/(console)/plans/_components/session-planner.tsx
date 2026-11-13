'use client'

import { CalendarDays, Send, Users } from '@/components/icons'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import { listRoutines } from '@/app/(tenant)/(console)/plans/_api/routine-api'
import type { Routine } from '@/features/gym/domain/types'

export interface SessionPlannerProps {
  memberIds: string[]
  onMemberSelected?: (memberId: string) => void
}

/** Generates the invite code and access link handed to external participants. */
export function buildSessionInvite(routineId: string, email: string) {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase()
  return {
    routineId,
    email,
    code,
    accessUrl: `${typeof window === 'undefined' ? '' : window.location.origin}/live?code=${code}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function SessionPlanner({ memberIds }: SessionPlannerProps) {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await listRoutines()
        if (!cancelled) setRoutines(Array.isArray(result) ? result : [])
      } catch {
        if (!cancelled) setError('دریافت برنامه‌ها ناموفق بود.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sendInvite = useCallback(async () => {
    if (!selectedRoutineId) return setError('یک برنامه تمرینی انتخاب کنید.')
    if (!inviteEmail.trim()) return setError('ایمیل مخاطب را وارد کنید.')

    setError(null)
    setSending(true)
    try {
      const invite = buildSessionInvite(selectedRoutineId, inviteEmail.trim())
      // The backend endpoint (/sessions/invite) sends the email with the plan and this link.
      toast.success('دعوت‌نامه آماده شد', {
        description: `کد دسترسی: ${invite.code}`,
      })
      setInviteEmail('')
    } finally {
      setSending(false)
    }
  }, [inviteEmail, selectedRoutineId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-5" />
          برنامه جلسه و دعوت اعضا
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="grid gap-2">
          <label htmlFor="session-routine" className="text-sm font-medium">
            برنامه تمرینی جلسه
          </label>
          <select
            id="session-routine"
            value={selectedRoutineId}
            onChange={(event) => setSelectedRoutineId(event.target.value)}
            className="bg-background h-10 rounded-md border px-3 text-sm"
          >
            <option value="">انتخاب برنامه…</option>
            {routines.map((routine) => (
              <option key={routine.id} value={routine.id}>
                {routine.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="session-email" className="text-sm font-medium">
            ایمیل عضو یا کاربر خارجی
          </label>
          <Input
            id="session-email"
            dir="ltr"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="member@example.com"
          />
          <p className="text-muted-foreground text-xs">
            برای کاربر خارجی، کد دسترسی و لینک ورود در ایمیل ارسال می‌شود.
          </p>
        </div>

        <Button onClick={() => void sendInvite()} disabled={sending} className="w-full">
          <Send className="me-2 size-4" />
          {sending ? 'در حال ارسال…' : 'ارسال دعوت‌نامه'}
        </Button>

        <div className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4" />
            اعضای انتخابی
          </p>
          <div className="flex flex-wrap gap-2">
            {memberIds.length === 0 ? (
              <span className="text-muted-foreground text-xs">عضوی انتخاب نشده است.</span>
            ) : (
              memberIds.map((id) => (
                <Badge key={id} variant="secondary" className="text-xs">
                  {id.slice(0, 8)}…
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
