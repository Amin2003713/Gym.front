'use client'

import { Check, LoaderCircle, Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { toast } from '@/lib/toast'

import { muscleApi, type MuscleOption } from '../_api/muscle-api'
import type { ExerciseMuscleRole } from '../_model/exercise.types'

export interface PickedMuscle {
  muscleId: string
  role: ExerciseMuscleRole
}

interface MusclePickerProps {
  value: PickedMuscle[]
  onChange: (next: PickedMuscle[]) => void
  disabled?: boolean
}

/**
 * Muscles come from the server (Persian names only for now). The dropdown doubles as an
 * "add option" control: a name that does not exist yet can be created inline and is then selected.
 */
export default function MusclePicker({ value, onChange, disabled }: MusclePickerProps) {
  const [options, setOptions] = useState<MuscleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true

    void muscleApi
      .list()
      .then((rows) => {
        if (active) setOptions(rows)
      })
      .catch(() => {
        if (active) toast.error('فهرست عضلات دریافت نشد.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const byId = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    const free = options.filter(
      (option) => !value.some((picked) => picked.muscleId === option.id),
    )

    if (!term) return free.slice(0, 40)

    return free
      .filter(
        (option) =>
          option.name.toLowerCase().includes(term) ||
          option.code.toLowerCase().includes(term),
      )
      .slice(0, 40)
  }, [options, search, value])

  const add = (muscleId: string) => {
    onChange([...value, { muscleId, role: 1 }])
    setSearch('')
  }

  const toggleRole = (muscleId: string) =>
    onChange(
      value.map((picked) =>
        picked.muscleId === muscleId
          ? { ...picked, role: picked.role === 1 ? 2 : 1 }
          : picked,
      ),
    )

  const createAndAdd = async () => {
    const name = search.trim()

    if (name.length < 2) {
      toast.error('نام عضله را کامل وارد کنید.')
      return
    }

    setCreating(true)

    try {
      const created = await muscleApi.create(name)
      setOptions((old) => [...old, created])
      add(created.id)
    } catch (error) {
      toast.error('افزودن عضله ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((picked) => {
            const option = byId.get(picked.muscleId)

            return (
              <span
                key={picked.muscleId}
                className="bg-secondary inline-flex items-center gap-1.5 rounded-full py-1 ps-3 pe-1 text-sm"
              >
                {option?.name ?? 'عضله'}
                <button
                  type="button"
                  onClick={() => toggleRole(picked.muscleId)}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    picked.role === 1
                      ? 'bg-primary/15 text-primary'
                      : 'bg-background text-muted-foreground border'
                  }`}
                  title="تغییر نقش عضله"
                >
                  {picked.role === 1 ? 'اصلی' : 'کمکی'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(value.filter((x) => x.muscleId !== picked.muscleId))
                  }
                  disabled={disabled}
                  aria-label={`حذف ${option?.name ?? 'عضله'}`}
                  className="hover:bg-background/70 rounded-full p-1"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      <div className="relative">
        <div className="border-input bg-background flex min-h-11 items-center gap-2 rounded-lg border px-3">
          <Search className="text-muted-foreground size-4" />
          <input
            value={search}
            disabled={disabled}
            onChange={(event) => {
              setSearch(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="جست‌وجوی عضله یا افزودن عضله جدید…"
            className="h-10 flex-1 bg-transparent text-sm outline-none"
          />
          {loading && <LoaderCircle className="size-4 animate-spin" />}
        </div>

        {open && (
          <div className="bg-popover absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border shadow-lg">
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => add(option.id)}
                className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm"
              >
                <span>{option.name}</span>
                <span className="text-muted-foreground text-[11px]">{option.code}</span>
              </button>
            ))}

            {search.trim().length > 1 && (
              <button
                type="button"
                onClick={() => void createAndAdd()}
                disabled={creating}
                className="text-primary hover:bg-muted flex w-full items-center gap-2 border-t px-3 py-2 text-start text-sm font-semibold disabled:opacity-60"
              >
                {creating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                افزودن «{search.trim()}» به فهرست عضلات
              </button>
            )}

            {filtered.length === 0 && search.trim().length <= 1 && (
              <p className="text-muted-foreground px-3 py-2 text-sm">
                عضله‌ای یافت نشد.
              </p>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border-t px-3 py-2 text-xs text-muted-foreground hover:bg-muted w-full"
            >
              <Check className="me-1 inline size-3.5" /> بستن فهرست
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
