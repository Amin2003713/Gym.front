'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * The dashboard shell used by every landing page in the app (staff console, member home): one stat
 * tile, one content panel and one shortcut card, so a page never reinvents its own card style.
 */

export type DashboardStatTone = 'primary' | 'green' | 'orange' | 'blue'

const TONE_CLASS: Record<DashboardStatTone, string> = {
  primary: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
}

export function DashboardStat({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: DashboardStatTone
}) {
  return (
    <div className="bg-card rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
        </div>
        <span className={`flex size-11 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">{detail}</p>
    </div>
  )
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function DashboardModeCard({
  href,
  icon: Icon,
  title,
  detail,
  active = false,
}: {
  href: string
  icon: LucideIcon
  title: string
  detail: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        active ? 'border-primary/40 bg-primary/5' : 'hover:border-primary/40 hover:bg-muted/50'
      }`}
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted-foreground mt-1 block text-xs leading-5">{detail}</span>
      </span>
    </Link>
  )
}
