'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { useMuscleBalance } from '@/app/(tenant)/_api/use-muscle-balance'
import { GamificationSection } from '@/app/(tenant)/_components/gamification/gamification-section'
import { DeepAnalytics } from '@/app/(tenant)/_components/insight/deep-analytics'
import { RangePicker } from '@/app/(tenant)/_components/insight/insight-shell'
import OverviewTab from '@/app/(tenant)/_components/progress/overview-tab'

import { StatsExtras } from './stats-extras'

export function MemberStats() {
  const { sessions, listItems, stats, loading, error, range, setRange, refetch } =
    useMuscleBalance()

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">آمار</h1>
        <p className="text-muted-foreground text-sm leading-6">
          حجم، ست و زمان تمرین از جلسات ثبت‌شده — بدون عدد ساختگی.
        </p>
        <RangePicker range={range} onRange={setRange} onRefresh={refetch} loading={loading} />
      </header>

      {error && (
        <div role="alert" className="border-destructive/30 bg-destructive/5 rounded-xl border p-3 text-xs">
          {error}
        </div>
      )}

      <OverviewTab sessions={sessions} stats={stats} loading={loading} />

      <StatsExtras sessions={sessions} stats={stats} loading={loading} />

      <DeepAnalytics sessions={sessions} listItems={listItems} />

      <GamificationSection variant="full" />

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/muscles"
          className="bg-card hover:border-primary/40 flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold transition-colors"
        >
          کارکرد و ریکاوری عضلات
          <ChevronLeft className="text-muted-foreground size-4" />
        </Link>
        <Link
          href="/structural-balance"
          className="bg-card hover:border-primary/40 flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold transition-colors"
        >
          تعادل ساختاری
          <ChevronLeft className="text-muted-foreground size-4" />
        </Link>
      </div>
    </div>
  )
}
