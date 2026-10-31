'use client'

import { DoorOpen, Lock, Plus, RefreshCw, Trash2, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import {
  createLockerRoom,
  createLockerZone,
  deleteLockerRoom,
  deleteLockerZone,
  getLockerAnalytics,
  getLockerMap,
  releaseLocker,
  setLockerStatus,
  unlockLocker,
} from '@/app/(tenant)/_api/locker-api'
import { LockerRoomMap } from '@/app/(tenant)/_components/locker/locker-room-map'
import {
  LOCKER_SIZE_LABELS,
  LockerSize,
  LockerStatus,
  ZONE_ACCESS_LABELS,
  type Locker,
  type LockerAnalytics,
  type LockerMap,
  type LockerRoom,
  type LockerZone,
  LockerZoneAccess,
} from '@/app/(tenant)/_model/locker.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const emptyRoom = {
  name: '',
  floor: '',
  hardwareProvider: '',
  hardwareEndpoint: '',
  unlockWindowMinutes: 2,
  minutesBeforeWorkout: 10,
  minutesAfterWorkout: 15,
}

const emptyZone = {
  lockerRoomId: '',
  name: '',
  access: LockerZoneAccess.General,
  rows: 2,
  columns: 6,
}

/**
 * Staff side of the digital locker room: the occupancy picture, the designer for rooms and sections,
 * and the per-locker controls (open, release, out of service) with every action audited server-side.
 */
export function LockerConsole() {
  const [map, setMap] = useState<LockerMap | null>(null)
  const [analytics, setAnalytics] = useState<LockerAnalytics | null>(null)
  const [selected, setSelected] = useState<Locker | null>(null)
  const [selectedZone, setSelectedZone] = useState<LockerZone | null>(null)
  const [room, setRoom] = useState(emptyRoom)
  const [zone, setZone] = useState(emptyZone)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [roomMap, stats] = await Promise.all([getLockerMap(), getLockerAnalytics()])

        if (cancelled) return

        setMap(roomMap)
        setAnalytics(stats)
        setZone((current) =>
          current.lockerRoomId || roomMap.rooms.length === 0
            ? current
            : { ...current, lockerRoomId: roomMap.rooms[0].id },
        )
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت اطلاعات کمدرو ناموفق بود', {
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

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)

    try {
      await action()
      toast.success(message)
      reload()
    } catch (error) {
      toast.error('عملیات ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const addRoom = () =>
    run(
      () =>
        createLockerRoom({
          name: room.name.trim(),
          floor: room.floor || null,
          hardwareProvider: room.hardwareProvider || null,
          hardwareEndpoint: room.hardwareEndpoint || null,
          unlockWindowMinutes: room.unlockWindowMinutes,
          minutesBeforeWorkout: room.minutesBeforeWorkout,
          minutesAfterWorkout: room.minutesAfterWorkout,
        }),
      'کمدرو اضافه شد',
    ).then(() => setRoom(emptyRoom))

  const addZone = () =>
    run(
      () =>
        createLockerZone({
          lockerRoomId: zone.lockerRoomId,
          name: zone.name.trim(),
          access: zone.access,
          rows: zone.rows,
          columns: zone.columns,
          generateLockers: true,
          defaultSize: LockerSize.Medium,
        }),
      'بخش و کمدهای آن ساخته شد',
    ).then(() => setZone((current) => ({ ...emptyZone, lockerRoomId: current.lockerRoomId })))

  if (loading) {
    return <p className="text-muted-foreground p-4 text-sm">در حال بارگذاری…</p>
  }

  return (
    <div className="space-y-5 p-1">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">کمدهای هوشمند</h1>
          <p className="text-muted-foreground text-sm leading-6">
            نقشه کمدرو، تخصیص هوشمند و وضعیت سامانه بازکن.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="size-4" />
          به‌روزرسانی
        </Button>
      </header>

      {analytics && (
        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="اشغال لحظه‌ای" value={`${fa(analytics.occupied)} از ${fa(analytics.lockers)}`} extra={`${fa(analytics.utilizationPercent)}٪`} />
          <Stat label="ساعت اوج" value={`${fa(analytics.peakHour)}:۰۰`} extra={`${fa(analytics.assignments)} تخصیص`} />
          <Stat
            label="میانگین در اختیار بودن"
            value={`${fa(Math.round(analytics.averageOccupancyMinutes))} دقیقه`}
            extra={`${fa(analytics.zoneCount)} بخش`}
          />
          <Stat
            label="سلامت درب‌ها"
            value={`${fa(analytics.unlockAttempts)} باز کردن`}
            extra={`${fa(analytics.unlockFailures)} خطا`}
          />
        </section>
      )}

      {map && (
        <LockerRoomMap
          rooms={map.rooms}
          selectedId={selected?.id ?? null}
          onSelect={(locker, lockerZone) => {
            setSelected(locker)
            setSelectedZone(lockerZone)
          }}
        />
      )}

      {selected && selectedZone && (
        <section className="bg-card space-y-3 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold tabular-nums">
                کمد {selected.code} · {selectedZone.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {LOCKER_SIZE_LABELS[selected.size]} · {ZONE_ACCESS_LABELS[selectedZone.access]}
                {selected.occupiedUntilUtc
                  ? ` · تا ${new Date(selected.occupiedUntilUtc).toLocaleString('fa-IR')}`
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  run(() => unlockLocker(selected.id, true), 'باز کردن دستی ثبت شد')
                }
              >
                <DoorOpen className="size-4" />
                باز کردن (استاندارد)
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || !selected.occupiedByUserId}
                onClick={() => run(() => releaseLocker(selected.id), 'کمد آزاد شد')}
              >
                <Lock className="size-4" />
                آزاد کردن
              </Button>
              {selected.status === LockerStatus.OutOfService ? (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => setLockerStatus(selected.id, LockerStatus.Available),
                      'کمد به سرویس برگشت',
                    )
                  }
                >
                  <Wrench className="size-4" />
                  بازگشت به سرویس
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        setLockerStatus(
                          selected.id,
                          LockerStatus.OutOfService,
                          'خارج از سرویس توسط کارکنان',
                        ),
                      'کمد خارج از سرویس شد',
                    )
                  }
                >
                  <Wrench className="size-4" />
                  خارج از سرویس
                </Button>
              )}
            </div>
          </div>

          {selected.note && (
            <p className="text-muted-foreground text-xs">یادداشت: {selected.note}</p>
          )}
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="bg-card space-y-3 rounded-2xl border p-4">
          <h2 className="text-sm font-bold">افزودن کمدرو</h2>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="نام کمدرو (مثلاً کمدرو A)"
              value={room.name}
              onChange={(event) => setRoom({ ...room, name: event.target.value })}
            />
            <Input
              placeholder="طبقه (اختیاری)"
              value={room.floor}
              onChange={(event) => setRoom({ ...room, floor: event.target.value })}
            />
            <label className="text-xs">
              <span className="text-muted-foreground">سامانه بازکن</span>
              <select
                className="border-input mt-1 h-9 w-full rounded-md border px-2 text-xs"
                value={room.hardwareProvider}
                onChange={(event) => setRoom({ ...room, hardwareProvider: event.target.value })}
              >
                <option value="">دستی (بدون بازکن)</option>
                <option value="http">وب‌سرویس HTTP</option>
              </select>
            </label>
            <Input
              placeholder="آدرس سامانه بازکن (Endpoint)"
              value={room.hardwareEndpoint}
              onChange={(event) => setRoom({ ...room, hardwareEndpoint: event.target.value })}
            />
            <NumberField
              label="زمان باز بودن در (دقیقه)"
              value={room.unlockWindowMinutes}
              onChange={(value) => setRoom({ ...room, unlockWindowMinutes: value })}
            />
            <NumberField
              label="تعویض لباس قبل از تمرین (دقیقه)"
              value={room.minutesBeforeWorkout}
              onChange={(value) => setRoom({ ...room, minutesBeforeWorkout: value })}
            />
            <NumberField
              label="تعویض لباس بعد از تمرین (دقیقه)"
              value={room.minutesAfterWorkout}
              onChange={(value) => setRoom({ ...room, minutesAfterWorkout: value })}
            />
          </div>

          <Button onClick={addRoom} disabled={busy || room.name.trim().length < 2}>
            <Plus className="size-4" />
            افزودن کمدرو
          </Button>
        </article>

        <article className="bg-card space-y-3 rounded-2xl border p-4">
          <h2 className="text-sm font-bold">افزودن بخش و ساخت کمدها</h2>

          {map && map.rooms.length === 0 ? (
            <p className="text-muted-foreground text-xs">اول یک کمدرو بسازید.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs">
                <span className="text-muted-foreground">کمدرو</span>
                <select
                  className="border-input mt-1 h-9 w-full rounded-md border px-2 text-xs"
                  value={zone.lockerRoomId}
                  onChange={(event) => setZone({ ...zone, lockerRoomId: event.target.value })}
                >
                  {map?.rooms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs">
                <span className="text-muted-foreground">بخش</span>
                <select
                  className="border-input mt-1 h-9 w-full rounded-md border px-2 text-xs"
                  value={zone.access}
                  onChange={(event) =>
                    setZone({ ...zone, access: Number(event.target.value) as LockerZoneAccess })
                  }
                >
                  {Object.entries(ZONE_ACCESS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                placeholder="نام بخش (مثلاً بخش آقایان)"
                value={zone.name}
                onChange={(event) => setZone({ ...zone, name: event.target.value })}
              />
              <NumberField
                label="ردیف"
                value={zone.rows}
                onChange={(value) => setZone({ ...zone, rows: value })}
              />
              <NumberField
                label="ستون"
                value={zone.columns}
                onChange={(value) => setZone({ ...zone, columns: value })}
              />
            </div>
          )}

          <Button
            onClick={addZone}
            disabled={busy || !zone.lockerRoomId || zone.name.trim().length < 2}
          >
            <Plus className="size-4" />
            ساخت بخش ({fa(zone.rows * zone.columns)} کمد)
          </Button>
        </article>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">کمدروها</h2>

        {map?.rooms.length === 0 && (
          <p className="text-muted-foreground text-xs">
            هنوز کمدرویی ساخته نشده است. با فرم بالا اولین کمدرو را بسازید.
          </p>
        )}

        <ul className="space-y-2">
          {map?.rooms.map((item) => (
            <RoomRow
              key={item.id}
              room={item}
              busy={busy}
              onDeleteRoom={() => run(() => deleteLockerRoom(item.id), 'کمدرو حذف شد')}
              onDeleteZone={(zoneId) => run(() => deleteLockerZone(zoneId), 'بخش حذف شد')}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="bg-card rounded-2xl border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-extrabold tabular-nums">{value}</p>
      {extra && <p className="text-muted-foreground text-[11px] tabular-nums">{extra}</p>}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1"
      />
    </label>
  )
}

function RoomRow({
  room,
  busy,
  onDeleteRoom,
  onDeleteZone,
}: {
  room: LockerRoom
  busy: boolean
  onDeleteRoom: () => void
  onDeleteZone: (zoneId: string) => void
}) {
  const lockers = room.zones.reduce((total, zone) => total + zone.lockers.length, 0)

  return (
    <li className="bg-card rounded-2xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{room.name}</p>
          <p className="text-muted-foreground text-xs">
            {fa(room.zones.length)} بخش · {fa(lockers)} کمد ·{' '}
            {room.hardwareConfigured ? `بازکن ${room.hardwareProvider}` : 'بازکن دستی'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDeleteRoom} disabled={busy}>
          <Trash2 className="size-4" />
          حذف کمدرو
        </Button>
      </div>

      <ul className="mt-2 space-y-1">
        {room.zones.map((zone) => (
          <li key={zone.id} className="flex items-center justify-between gap-2 text-xs">
            <span>
              {zone.name} · {ZONE_ACCESS_LABELS[zone.access]} · {zone.rows}×{zone.columns}
            </span>
            <button
              type="button"
              className="text-destructive text-xs"
              disabled={busy}
              onClick={() => onDeleteZone(zone.id)}
            >
              حذف بخش
            </button>
          </li>
        ))}
      </ul>
    </li>
  )
}
