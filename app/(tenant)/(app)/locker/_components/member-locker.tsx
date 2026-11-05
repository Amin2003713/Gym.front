'use client'

import { Clock3, DoorOpen, Flag, KeyRound, RefreshCw } from '@/components/icons'
import { useCallback, useEffect, useState } from 'react'

import {
  checkIn,
  getLockerMap,
  getMyLocker,
  releaseLocker,
  reportLockerIssue,
  unlockLocker,
} from '@/app/(tenant)/_api/locker-api'
import { LockerRoomMap } from '@/app/(tenant)/_components/locker/locker-room-map'
import {
  LOCKER_SIZE_LABELS,
  LockerStatus,
  remainingMinutes,
  ZONE_ACCESS_LABELS,
  type Locker,
  type LockerAssignment,
  type LockerMap,
  type LockerRoom,
  type LockerZone,
} from '@/app/(tenant)/_model/locker.types'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

const WORKOUT_CHOICES = [45, 60, 90] as const

/**
 * The member's locker screen: where their locker is, how long it is theirs, and the actions they
 * actually need - take one, open it, give it back, report it broken.
 */
export function MemberLocker() {
  const [map, setMap] = useState<LockerMap | null>(null)
  const [mine, setMine] = useState<LockerAssignment | null>(null)
  const [selected, setSelected] = useState<Locker | null>(null)
  const [selectedZone, setSelectedZone] = useState<LockerZone | null>(null)
  const [workoutMinutes, setWorkoutMinutes] = useState<number>(60)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [roomMap, assignment] = await Promise.all([getLockerMap(), getMyLocker()])

        if (cancelled) return

        setMap(roomMap)
        setMine(assignment)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت اطلاعات کمد ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => {
    setLoading(true)
    setVersion((current) => current + 1)
  }, [])

  const select = (locker: Locker, zone: LockerZone, _room: LockerRoom) => {
    setSelected(locker)
    setSelectedZone(zone)
  }

  const take = async () => {
    setBusy(true)

    try {
      const assignment = await checkIn(workoutMinutes)

      toast.success(
        assignment.reusedExistingHold ? 'کمد شما همچنان رزرو است' : 'کمد برای شما ثبت شد',
        { description: `کمد ${assignment.code} در ${assignment.zoneName}` },
      )
      setVersion((current) => current + 1)
    } catch (error) {
      toast.error('گرفتن کمد ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const unlock = async (lockerId: string) => {
    setBusy(true)

    try {
      const result = await unlockLocker(lockerId)

      if (result.unlocked)
        toast.success(result.message ?? 'کمد باز شد', {
          description: result.validUntilUtc
            ? `تا ${formatTime(result.validUntilUtc)} می‌توانید در را باز نگه دارید.`
            : undefined,
        })
      else toast.warning(result.message ?? 'باز کردن کمد ممکن نشد')
    } catch (error) {
      toast.error('باز کردن کمد ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const release = async () => {
    if (!mine) return

    setBusy(true)

    try {
      await releaseLocker(mine.lockerId)
      toast.success('کمد آزاد شد')
      setMine(null)
      setVersion((current) => current + 1)
    } catch (error) {
      toast.error('آزاد کردن کمد ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const reportIssue = async (lockerId: string) => {
    setBusy(true)

    try {
      await reportLockerIssue(lockerId, 'گزارش خرابی از صفحه کمد من')
      toast.success('گزارش شما برای کارکنان ثبت شد')
    } catch (error) {
      toast.error('ثبت گزارش ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">در حال بارگذاری کمدها…</p>
  }

  if (!map || map.lockers === 0) {
    return (
      <div className="bg-muted/40 space-y-2 rounded-2xl border border-dashed p-6 text-sm">
        <p className="font-semibold">این باشگاه هنوز کمد هوشمند ندارد.</p>
        <p className="text-muted-foreground">
          کمد دیجیتال بخشی از پلن «کمد هوشمند» است؛ اگر باشگاه شما آن را فعال کند، کمد شما همین‌جا
          نمایش داده می‌شود.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">کمد من</h1>
        <p className="text-muted-foreground text-sm leading-6">
          کمد شما بر اساس زمان ورود و مدت تمرین پیش‌بینی‌شده انتخاب می‌شود تا جلوی کمدرو شلوغ نشود.
        </p>
      </header>

      {mine ? (
        <section className="bg-card space-y-3 rounded-2xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs">{mine.roomName} · {mine.zoneName}</p>
              <p className="text-xl font-extrabold tabular-nums">کمد {mine.code}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {LOCKER_SIZE_LABELS[mine.size]} · {ZONE_ACCESS_LABELS[zoneAccessOf(map, mine)]} · ردیف{' '}
                {mine.row}، ستون {mine.column}
              </p>
            </div>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
              <Clock3 className="size-3.5" />
              {remainingMinutes(mine.untilUtc)} دقیقه باقی‌مانده
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => unlock(mine.lockerId)} disabled={busy}>
              <DoorOpen className="size-4" />
              {mine.hardwareConfigured ? 'باز کردن کمد' : 'راهنمای باز کردن'}
            </Button>
            <Button variant="outline" onClick={release} disabled={busy}>
              <KeyRound className="size-4" />
              آزاد کردن کمد
            </Button>
            <Button variant="ghost" onClick={() => reportIssue(mine.lockerId)} disabled={busy}>
              <Flag className="size-4" />
              گزارش خرابی
            </Button>
          </div>

          {!mine.hardwareConfigured && (
            <p className="text-muted-foreground text-xs leading-6">
              این کمدرو به بازکن هوشمند متصل نیست؛ کلید را از نگهبانی بگیرید. با فعال‌سازی بازکن، همین
              دکمه در را باز می‌کند.
            </p>
          )}
        </section>
      ) : (
        <section className="bg-card space-y-3 rounded-2xl border p-4">
          <p className="text-sm font-bold">کمد نمی‌خواهید؟</p>
          <p className="text-muted-foreground text-sm leading-6">
            مدت تمرینتان را انتخاب کنید تا بهترین کمد آزاد در کمدروی شما رزرو شود.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {WORKOUT_CHOICES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setWorkoutMinutes(minutes)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  workoutMinutes === minutes
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:border-primary/40'
                }`}
              >
                {minutes} دقیقه
              </button>
            ))}
            <Button onClick={take} disabled={busy}>
              <KeyRound className="size-4" />
              گرفتن کمد
            </Button>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">نقشه کمدرو</h2>
        <Button variant="ghost" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="size-4" />
          به‌روزرسانی
        </Button>
      </div>

      <LockerRoomMap
        rooms={map.rooms}
        myLockerId={mine?.lockerId ?? null}
        selectedId={selected?.id ?? null}
        onSelect={select}
      />

      {selected && selectedZone && (
        <section className="bg-card space-y-2 rounded-2xl border p-4">
          <p className="text-sm font-bold tabular-nums">
            کمد {selected.code} · {selectedZone.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {LOCKER_SIZE_LABELS[selected.size]} · وضعیت:{' '}
            {selected.status === LockerStatus.Available
              ? 'آزاد'
              : selected.status === LockerStatus.Occupied
                ? 'اشغال'
                : 'خارج از سرویس'}
            {selected.note ? ` · ${selected.note}` : ''}
          </p>
          {selected.id === mine?.lockerId && (
            <Button size="sm" onClick={() => unlock(selected.id)} disabled={busy}>
              <DoorOpen className="size-4" />
              باز کردن کمد من
            </Button>
          )}
        </section>
      )}
    </div>
  )
}

function zoneAccessOf(map: LockerMap, assignment: LockerAssignment) {
  const zone = map.rooms
    .flatMap((room) => room.zones)
    .find((item) => item.id === assignment.zoneId)

  return zone?.access ?? 0
}

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
