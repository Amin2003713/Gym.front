'use client'

import { AlertTriangle, CheckCircle2, Scale } from 'lucide-react'
import { useMemo } from 'react'

import { useMuscleBalance } from '@/app/(tenant)/_api/use-muscle-balance'
import {
  InsightEmpty,
  InsightSection,
  RangePicker,
} from '@/app/(tenant)/_components/insight/insight-shell'
import type { MuscleUse } from '@/app/(tenant)/_model/muscle-balance'
import {
  BALANCE_GROUP_LABEL,
  BALANCE_STATUS,
  groupVolumes,
  pairBalances,
  type BalanceGroup,
} from '@/app/(tenant)/_model/structural-balance'
import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

const fa = (value: number) => value.toLocaleString('fa-IR')

export function MemberStructuralBalance() {
  const { stats, loading, error, range, setRange, refetch } = useMuscleBalance()

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

    const pairs = pairBalances(perMuscle)
    const total = pairs.reduce((sum, pair) => sum + pair.left.sets + pair.right.sets, 0)

    return {
      pairs,
      total,
      groups: groupVolumes(perMuscle),
      flagged: pairs.filter((pair) => pair.status === 'imbalanced' || pair.status === 'mild'),
    }
  }, [stats])

  const maxPairSets = Math.max(
    1,
    ...data.pairs.flatMap((pair) => [pair.left.sets, pair.right.sets]),
  )

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">تعادل ساختاری</h1>
        <p className="text-muted-foreground text-sm leading-6">
          عضلات مقابل هم باید نسبت نزدیکی داشته باشند؛ فاصله بزرگ یعنی یک طرف دارد بار بیشتر را
          می‌کشد.
        </p>
        <RangePicker range={range} onRange={setRange} onRefresh={refetch} loading={loading} />
      </header>

      {error && (
        <div role="alert" className="border-destructive/30 bg-destructive/5 rounded-xl border p-3 text-xs">
          {error}
        </div>
      )}

      <InsightSection
        title="جفت‌های متقابل"
        description="نسبت ست‌های دو عضله مقابل؛ بالای ۸۰٪ متعادل حساب می‌شود."
      >
        {loading ? (
          <div className="text-muted-foreground flex min-h-32 items-center justify-center text-sm">
            در حال محاسبه…
          </div>
        ) : data.total === 0 ? (
          <InsightEmpty message="در این بازه ستی ثبت نشده است. بعد از چند جلسه، نسبت‌ها اینجا ساخته می‌شوند." />
        ) : (
          <ul className="space-y-5">
            {data.pairs.map((pair) => {
              const status = BALANCE_STATUS[pair.status]

              return (
                <li key={pair.label}>
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold">{pair.label}</span>
                    <span className={`font-semibold ${status.className}`}>
                      {pair.status === 'none' ? status.label : `${fa(pair.ratio)}٪`}
                    </span>
                  </div>

                  <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${status.bar}`}
                      style={{ width: `${(Math.max(pair.left.sets, pair.right.sets) / maxPairSets) * 100}%` }}
                    />
                  </div>

                  <div className="text-muted-foreground mt-1.5 flex justify-between text-[11px] tabular-nums">
                    <span>{fa(pair.left.sets)} ست</span>
                    <span>{fa(pair.right.sets)} ست</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </InsightSection>

      <InsightSection
        title="سهم گروه‌های حرکتی"
        description="سهم هر گروه از کل ست‌های بازه — پا معمولاً بیشترین سهم را دارد."
      >
        {data.total === 0 ? (
          <InsightEmpty message="داده‌ای برای تقسیم‌بندی وجود ندارد." />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.groups.map(({ group, sets, share }) => (
              <li key={group} className="bg-muted/40 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Scale className="text-muted-foreground size-3.5" />
                    {BALANCE_GROUP_LABEL[group as BalanceGroup]}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{fa(share)}٪</span>
                </div>
                <div className="bg-background mt-2 h-1.5 overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${share}%` }} />
                </div>
                <p className="text-muted-foreground mt-1 text-[11px]">{fa(sets)} ست</p>
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

      <InsightSection title="پیشنهاد" description="از همان داده‌ها، بدون حدس اضافه.">
        {data.total === 0 ? (
          <InsightEmpty message="بعد از ثبت چند جلسه، پیشنهادها بر اساس نسبت‌های واقعی نوشته می‌شوند." />
        ) : data.flagged.length === 0 ? (
          <p className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            همه جفت‌ها در همین بازه نسبت متعادلی دارند. همین الگو را ادامه بده.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.flagged.map((pair) => {
              const weaker = pair.left.sets <= pair.right.sets ? pair.left : pair.right
              const stronger = weaker === pair.left ? pair.right : pair.left
              const suggestion =
                stronger.sets === 0
                  ? `${pair.label}: هر دو طرف در این بازه تمرین نشده‌اند.`
                  : `${pair.label}: ${fa(weaker.sets)} ست در برابر ${fa(stronger.sets)} ست. یک یا دو حرکت اضافه برای ${pair.label.split(' / ')[weaker === pair.left ? 0 : 1]} کافی است.`

              return (
                <li key={pair.label} className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs leading-6 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {suggestion}
                </li>
              )
            })}
          </ul>
        )}
      </InsightSection>
    </div>
  )
}
