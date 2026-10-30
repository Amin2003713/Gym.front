'use client'

import { MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  LOCKER_SIZE_LABELS,
  LockerStatus,
  ZONE_ACCESS_LABELS,
  type Locker,
  type LockerRoom,
  type LockerZone,
} from '@/app/(tenant)/_model/locker.types'
import { Button } from '@/components/ui/button'

type Props = {
  rooms: LockerRoom[]
  /** The caller's own locker: highlighted and reachable through the "find it" button. */
  myLockerId?: string | null
  selectedId?: string | null
  onSelect?: (locker: Locker, zone: LockerZone, room: LockerRoom) => void
  /** Staff see who holds what; members get the same map without other people's names. */
  className?: string
}

/**
 * Visual locker room. Each zone is drawn as its real rows × columns grid, so a member can see where
 * their locker is instead of reading a code, and staff can spot a full or broken section at a glance.
 */
export function LockerRoomMap({
  rooms,
  myLockerId,
  selectedId,
  onSelect,
  className = '',
}: Props) {
  const roomWithMine = useMemo(
    () =>
      rooms.find((room) =>
        room.zones.some((zone) => zone.lockers.some((locker) => locker.id === myLockerId)),
      )?.id,
    [rooms, myLockerId],
  )

  const [activeRoomId, setActiveRoomId] = useState(roomWithMine ?? rooms[0]?.id ?? '')

  useEffect(() => {
    if (roomWithMine) setActiveRoomId(roomWithMine)
  }, [roomWithMine])

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0]

  const findMine = () => {
    if (!myLockerId) return

    const target = document.getElementById(`locker-${myLockerId}`)

    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-muted/40 rounded-2xl border border-dashed p-8 text-center text-sm">
        هنوز کمدرویی ثبت نشده است.
      </div>
    )
  }

  return (
    <section className={`space-y-3 ${className}`} dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {rooms.length > 1 ? (
          <div className="bg-muted inline-flex flex-wrap gap-1 rounded-xl p-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoomId(room.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  room.id === activeRoom?.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold">{activeRoom?.name}</p>
        )}

        {myLockerId && (
          <Button type="button" variant="outline" size="sm" onClick={findMine}>
            <Search className="size-4" />
            پیدا کردن کمد من
          </Button>
        )}
      </div>

      {activeRoom?.zones.map((zone) => (
        <div key={zone.id} className="bg-card space-y-2 rounded-2xl border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold">
              {zone.name}
              <span className="text-muted-foreground mr-2 text-xs font-normal">
                {ZONE_ACCESS_LABELS[zone.access]} · {zone.rows}×{zone.columns}
              </span>
            </p>
            <p className="text-muted-foreground text-xs tabular-nums">
              {zone.lockers.filter((locker) => locker.status === LockerStatus.Occupied).length} از{' '}
              {zone.lockers.length} اشغال
            </p>
          </div>

          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, zone.columns)}, minmax(0, 1fr))` }}
          >
            {zone.lockers.map((locker) => {
              const mine = locker.id === myLockerId
              const selected = locker.id === selectedId

              return (
                <button
                  key={locker.id}
                  id={`locker-${locker.id}`}
                  type="button"
                  onClick={() => onSelect?.(locker, zone, activeRoom)}
                  aria-label={`کمد ${locker.code}${mine ? ' (کمد شما)' : ''}`}
                  aria-pressed={selected}
                  title={`${locker.code} · ${LOCKER_SIZE_LABELS[locker.size]}`}
                  className={[
                    'flex h-11 flex-col items-center justify-center rounded-lg border text-[10px] leading-tight font-semibold tabular-nums transition-all',
                    'focus-visible:ring-ring outline-none focus-visible:ring-2',
                    locker.status === LockerStatus.OutOfService
                      ? 'bg-destructive/10 border-destructive/40 text-destructive line-through'
                      : locker.status === LockerStatus.Occupied
                        ? 'bg-muted border-border text-muted-foreground'
                        : 'bg-background border-border/70 hover:border-primary/50',
                    mine ? 'bg-primary text-primary-foreground border-primary shadow-md' : '',
                    selected ? 'ring-primary ring-2 ring-offset-1' : '',
                  ].join(' ')}
                >
                  <span>{locker.code}</span>
                  {mine && <span className="text-[9px] font-bold">کمد شما</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
        <Legend className="bg-background border-border/70" label="آزاد" />
        <Legend className="bg-muted border-border" label="اشغال" />
        <Legend className="bg-destructive/10 border-destructive/40" label="خارج از سرویس" />
        <Legend className="bg-primary border-primary" label="کمد شما" />
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          برای دیدن جزئیات، روی کمد بزنید.
        </span>
      </div>
    </section>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-3 rounded border ${className}`} />
      {label}
    </span>
  )
}
