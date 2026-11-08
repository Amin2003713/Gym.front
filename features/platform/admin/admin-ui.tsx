'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-border bg-card rounded-xl border">
      <header className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div>
          <h2 className="text-base font-extrabold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1 text-xs leading-6">{description}</p>
          )}
        </div>
        {actions}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('grid gap-2', className)}>
      <span className="text-xs font-bold">{label}</span>
      {children}
      {hint && <span className="text-muted-foreground text-[11px] leading-5">{hint}</span>}
    </label>
  )
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger'
  children: ReactNode
}) {
  const tones = {
    info: 'border-border bg-muted/50 text-muted-foreground',
    success: 'border-success/30 bg-success/5 text-success',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  }

  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-md border p-3 text-xs leading-6', tones[tone])}
    >
      {children}
    </p>
  )
}

export function ToneBadge({
  tone,
  children,
}: {
  tone: 'neutral' | 'success' | 'warning' | 'danger'
  children: ReactNode
}) {
  const tones = {
    neutral: 'border-border text-muted-foreground',
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-border rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm font-bold">{title}</p>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-xs leading-6">{body}</p>
    </div>
  )
}

export const textareaClass =
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-sm border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]'
