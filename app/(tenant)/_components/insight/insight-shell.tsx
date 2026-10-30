'use client'

import { RefreshCw } from 'lucide-react'

import type { BalanceRangeKey } from '@/app/(tenant)/_api/use-muscle-balance'

const RANGE_OPTIONS: Array<{ key: BalanceRangeKey; label: string }> = [
  { key: '7', label: '۷ روز' },
  { key: '30', label: '۳۰ روز' },
  { key: '90', label: '۹۰ روز' },
  { key: 'all', label: 'همه' },
]

/** Range switcher + refresh shared by the member analysis screens. */
export function RangePicker({
  range,
  onRange,
  onRefresh,
  loading,
}: {
  range: BalanceRangeKey
  onRange: (range: BalanceRangeKey) => void
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="bg-muted inline-flex rounded-full p-1">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onRange(option.key)}
            aria-pressed={range === option.key}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              range === option.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        aria-label="بروزرسانی داده‌ها"
        className="text-muted-foreground hover:text-foreground border-input rounded-full border p-2 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

export function InsightSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-card rounded-2xl border p-4 shadow-sm">
      <h2 className="font-bold">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function InsightEmpty({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex min-h-32 items-center justify-center rounded-xl border border-dashed p-6 text-center text-xs leading-6">
      {message}
    </div>
  )
}
