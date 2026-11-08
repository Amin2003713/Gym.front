import Link from 'next/link'

import { Check, Sparkles } from '@/components/icons'
import { formatToman } from '@/features/platform/format'
import type { PlatformPlan } from '@/features/platform/types'
import { cn } from '@/lib/utils'

type Props = {
  plans: PlatformPlan[]
  cycle?: 'monthly' | 'yearly'
  compact?: boolean
}

export function PricingCards({ plans, cycle = 'monthly', compact = false }: Props) {
  const ordered = [...plans].sort((a, b) => a.sortOrder - b.sortOrder)

  if (ordered.length === 0) {
    return (
      <p className="text-muted-foreground border-border rounded-xl border border-dashed p-6 text-sm">
        هنوز پلنی برای فروش ثبت نشده است. لطفاً بعداً دوباره سر بزنید.
      </p>
    )
  }

  return (
    <div className={cn('grid gap-4', compact ? 'md:grid-cols-3' : 'lg:grid-cols-3')}>
      {ordered.map((plan) => {
        const price = cycle === 'yearly' ? plan.yearlyPriceToman : plan.monthlyPriceToman

        return (
          <article
            key={plan.code}
            className={cn(
              'relative flex flex-col rounded-2xl border p-6',
              plan.isPopular
                ? 'border-primary/60 bg-card shadow-[0_18px_40px_-24px_rgba(251,154,60,0.55)]'
                : 'border-border bg-card/60',
            )}
          >
            {plan.isPopular && (
              <span className="bg-primary text-primary-foreground absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
                <Sparkles className="size-3.5" aria-hidden="true" />
                پیشنهاد ما
              </span>
            )}

            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl font-extrabold">{plan.name}</h3>
              {plan.isActive ? null : (
                <span className="text-muted-foreground text-xs font-semibold">غیرفعال</span>
              )}
            </div>

            <p className="text-muted-foreground mt-2 min-h-12 text-sm leading-6">
              {plan.description ?? ''}
            </p>

            <p className="mt-5 flex flex-wrap items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight">{formatToman(price)}</span>
              <span className="text-muted-foreground text-xs">
                {cycle === 'yearly' ? '/ سال' : '/ ماه'}
              </span>
            </p>

            <ul className="mt-6 grid flex-1 gap-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="leading-6">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/start?plan=${encodeURIComponent(plan.code)}&cycle=${cycle}`}
              className={cn(
                'mt-7 inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-bold transition-colors',
                plan.isPopular
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-input hover:bg-accent border',
              )}
            >
              انتخاب پلن {plan.name}
            </Link>
          </article>
        )
      })}
    </div>
  )
}
