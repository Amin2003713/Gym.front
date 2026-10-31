'use client'

import { Activity, HeartPulse } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { useMuscleBalance } from '@/app/(tenant)/_api/use-muscle-balance'
import {
  InsightEmpty,
  InsightSection,
  RangePicker,
} from '@/app/(tenant)/_components/insight/insight-shell'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import {
  loadLevels,
  recoveryLevels,
  type MuscleUse,
} from '@/app/(tenant)/_model/muscle-balance'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import { setsOf } from '@/app/(tenant)/_model/structural-balance'
import { useFigureGender } from '@/hooks/use-figure-gender'
import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

type MapMode = 'trained' | 'recovery'

export function MemberMuscles() {
  const { stats, loading, error, range, setRange, refetch } = useMuscleBalance()
  const figureGender = useFigureGender()
  const [mode, setMode] = useState<MapMode>('trained')
  const [selected, setSelected] = useState<MuscleSlug | null>(null)

  // One snapshot per mount keeps the recovery percentages stable while rendering.
  const [nowMs] = useState(() => Date.now())

  const data = useMemo(() => {
    const perMuscle = Object.fromEntries(
      MUSCLES.map((slug) => [
        slug,
        stats.perMuscle?.[slug] ?? {
          primarySets: 0,
          secondarySets: 0,
          volumeKg: 0,
          sessions: 0,
        },
      ]),
    ) as Record<MuscleSlug, MuscleUse>

    return {
      perMuscle,
      load: loadLevels(perMuscle),
      recovery: recoveryLevels(perMuscle, nowMs),
    }
  }, [stats, nowMs])

  const rows = useMemo(
    () =>
      MUSCLES.map((slug) => ({
          slug,
          sets: setsOf(data.perMuscle[slug]),
          recoveryPct: data.recovery.pcts[slug]?.pct ?? 100,
        }))
        .sort((a, b) => (mode === 'trained' ? b.sets - a.sets : a.recoveryPct - b.recoveryPct)),
    [data, mode],
  )

  const trained = rows.filter((row) => row.sets > 0)
  const selectedRow = selected ? rows.find((row) => row.slug === selected) : null

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">عضلات</h1>
        <p className="text-muted-foreground text-sm leading-6">
          هر عضله در بازه انتخابی چقدر کار کرده و چقدر ریکاوری شده است.
        </p>
        <RangePicker range={range} onRange={setRange} onRefresh={refetch} loading={loading} />
      </header>

      {error && (
        <div role="alert" className="border-destructive/30 bg-destructive/5 rounded-xl border p-3 text-xs">
          {error}
        </div>
      )}

      <div className="bg-muted flex rounded-full p-1">
        {(['trained', 'recovery'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
              mode === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {key === 'trained' ? <Activity className="size-3.5" /> : <HeartPulse className="size-3.5" />}
            {key === 'trained' ? 'کارکرد' : 'ریکاوری'}
          </button>
        ))}
      </div>

      <InsightSection
        title={mode === 'trained' ? 'نقشه کارکرد' : 'نقشه ریکاوری'}
        description={
          mode === 'trained'
            ? 'هرچه ست بیشتری زده باشی، سبزتر می‌شود.'
            : 'آبی یعنی استراحت کافی؛ قرمز یعنی تازه تمرین شده و بدن هنوز نساخته است.'
        }
      >
        {loading ? (
          <div className="text-muted-foreground flex min-h-56 items-center justify-center text-sm">
            در حال محاسبه…
          </div>
        ) : (
          <BodyMapPanel
            body={figureGender}
            palette={mode === 'trained' ? 'load' : 'recovery'}
            load={mode === 'trained' ? data.load : data.recovery.levels}
            selected={selected ?? undefined}
            onMuscle={(slug) => setSelected(slug as MuscleSlug)}
          />
        )}

        {selectedRow && (
          <div className="bg-muted/50 mt-3 rounded-xl px-3 py-2 text-xs">
            <span className="font-bold">{MUSCLE_LABEL[selectedRow.slug]}</span>
            <span className="text-muted-foreground">
              {' '}
              · {fa(selectedRow.sets)} ست ·{' '}
              {fa(Math.round(data.perMuscle[selectedRow.slug]?.volumeKg ?? 0))} kg ·{' '}
              {selectedRow.sets === 0
                ? 'در این بازه تمرین نشده'
                : `${fa(Math.round(selectedRow.recoveryPct))}٪ ریکاوری`}
            </span>
          </div>
        )}
      </InsightSection>

      <InsightSection
        title={mode === 'trained' ? 'کارکرد هر عضله' : 'ریکاوری هر عضله'}
        description={
          mode === 'trained'
            ? 'ست‌های اصلی + کمکی در بازه انتخاب‌شده'
            : 'کمترین ریکاوری اول؛ این‌ها هنوز آماده تمرین سنگین نیستند'
        }
      >
        {!loading && trained.length === 0 ? (
          <InsightEmpty message="هنوز جلسه‌ای در این بازه ثبت نشده است. یک تمرین را شروع کن تا این صفحه پر شود." />
        ) : (
          <ul className="space-y-3">
            {(mode === 'trained' ? trained : rows).map((row) => {
              const max = Math.max(1, ...rows.map((item) => item.sets))
              const pct =
                mode === 'trained' ? (row.sets / max) * 100 : Math.min(100, row.recoveryPct)

              return (
                <li key={row.slug}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelected(row.slug)}
                      className="font-semibold hover:underline"
                    >
                      {MUSCLE_LABEL[row.slug] ?? row.slug}
                    </button>
                    <span className="text-muted-foreground tabular-nums">
                      {mode === 'trained'
                        ? `${fa(row.sets)} ست`
                        : row.sets === 0
                          ? 'بدون تمرین'
                          : `${fa(Math.round(row.recoveryPct))}٪`}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        mode === 'trained'
                          ? 'bg-emerald-500'
                          : row.recoveryPct >= 80
                            ? 'bg-blue-500'
                            : row.recoveryPct >= 45
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </InsightSection>

      <Link
        href="/structural-balance"
        className="bg-card hover:border-primary/40 flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold transition-colors"
      >
        بررسی تعادل عضلات
        <span className="text-muted-foreground text-xs">سینه/پشت، بازو، پا…</span>
      </Link>
    </div>
  )
}
