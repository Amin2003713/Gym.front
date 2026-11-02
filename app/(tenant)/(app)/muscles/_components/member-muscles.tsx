'use client'

import { Activity, Box, HeartPulse } from 'lucide-react'
import dynamic from 'next/dynamic'
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
import { MUSCLE_REGION, type BodyRegion } from '@/lib/body-regions'
import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

// Lazy: the three.js bundle is fetched only when the 3D map is opened.
const BodyMap3D = dynamic(() => import('@/components/body/body-map-3d'), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex min-h-56 items-center justify-center text-xs">
      در حال بارگذاری نقشه سه‌بعدی…
    </div>
  ),
})

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

type MapMode = 'trained' | 'recovery'

export function MemberMuscles() {
  const { stats, loading, error, range, setRange, refetch } = useMuscleBalance()
  const figureGender = useFigureGender()
  const [mode, setMode] = useState<MapMode>('trained')
  const [selected, setSelected] = useState<MuscleSlug | null>(null)
  const [render, setRender] = useState<'2d' | '3d'>('2d')
  const [historySlug, setHistorySlug] = useState<MuscleSlug | null>(null)

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

  /** Muscle levels folded onto the 3D figure's regions (a muscle can shade two limbs). */
  const regionValues = useMemo(() => {
    const source = mode === 'trained' ? data.load : data.recovery.levels
    const values: Partial<Record<BodyRegion, number>> = {}

    for (const [slug, value] of Object.entries(source)) {
      for (const region of MUSCLE_REGION[slug] ?? []) {
        values[region] = Math.max(values[region] ?? 0, Number(value))
      }
    }

    return values
  }, [data, mode])

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
          <div className="space-y-2">
            <div className="flex justify-end">
              <div className="bg-muted flex rounded-full p-1">
                {(
                  [
                    { key: '2d', label: 'نقشه دوبعدی', icon: Activity },
                    { key: '3d', label: 'مدل سه‌بعدی', icon: Box },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={render === item.key}
                    onClick={() => setRender(item.key)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      render === item.key
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <item.icon className="size-3.5" aria-hidden />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {render === '3d' ? (
              <BodyMap3D
                values={regionValues}
                selected={
                  selected
                    ? (MUSCLE_REGION[selected]?.[0] as BodyRegion | undefined) ?? null
                    : null
                }
                onSelect={(region) => {
                  const slug = Object.entries(MUSCLE_REGION).find(([, regions]) =>
                    regions.includes(region),
                  )?.[0]

                  if (slug) setSelected(slug as MuscleSlug)
                }}
                height={340}
                activeColor={mode === 'trained' ? '#22C55E' : '#3B82F6'}
              />
            ) : (
              <BodyMapPanel
                body={figureGender}
                palette={mode === 'trained' ? 'load' : 'recovery'}
                load={mode === 'trained' ? data.load : data.recovery.levels}
                selected={selected ?? undefined}
                onMuscle={(slug) => setSelected(slug as MuscleSlug)}
              />
            )}
          </div>
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

      <InsightSection
        title="تاریخچه ۱۲ هفته"
        description="ست‌های هر عضله در ۱۲ هفته اخیر؛ ستون سمت راست، هفته جاری است."
      >
        {trained.length === 0 ? (
          <InsightEmpty message="برای دیدن تاریخچه، اول یک جلسه ثبت کن." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[...trained, ...rows.filter((row) => row.sets === 0)].slice(0, 12).map((row) => (
                <button
                  key={row.slug}
                  type="button"
                  aria-pressed={(historySlug ?? trained[0]?.slug) === row.slug}
                  onClick={() => setHistorySlug(row.slug)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    (historySlug ?? trained[0]?.slug) === row.slug
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {MUSCLE_LABEL[row.slug] ?? row.slug}
                </button>
              ))}
            </div>

            {(() => {
              const slug = historySlug ?? trained[0]?.slug
              const series = slug ? (stats.weeklyPerMuscle?.[slug] ?? []) : []
              const max = Math.max(1, ...series)
              const weeks = stats.weekStarts ?? []

              if (!slug || series.length === 0) {
                return (
                  <p className="text-muted-foreground py-4 text-center text-xs">
                    برای این عضله در بازه انتخابی ستی ثبت نشده است.
                  </p>
                )
              }

              return (
                <div>
                  <div className="flex h-32 items-end gap-1">
                    {series.map((value, index) => (
                      <div key={weeks[index] ?? index} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-muted-foreground text-[10px] tabular-nums">
                          {value > 0 ? fa(value) : ''}
                        </span>
                        <div
                          aria-label={`${fa(value)} ست در هفته ${index + 1}`}
                          className={`w-full rounded-t-md ${
                            value > 0 ? 'bg-primary' : 'bg-muted'
                          }`}
                          style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-muted-foreground mt-1 flex justify-between text-[10px]">
                    <span>
                      {weeks[0]
                        ? new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(
                            new Date(`${weeks[0]}T12:00:00`),
                          )
                        : '۱۲ هفته پیش'}
                    </span>
                    <span>هفته جاری</span>
                  </div>
                </div>
              )
            })()}
          </>
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
