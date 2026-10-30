'use client'

import { Switch } from '@/components/ui/switch'

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-xs leading-5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <SettingRow title={title} description={description}>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </SettingRow>
  )
}

export function ChoiceRow<T extends number>({
  title,
  description,
  value,
  options,
  onChange,
  disabled,
}: {
  title: string
  description?: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <SettingRow title={title} description={description}>
      <div className="bg-muted inline-flex flex-wrap rounded-full p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              value === option.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </SettingRow>
  )
}

export function NumberRow({
  title,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  title: string
  description?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  return (
    <SettingRow title={title} description={description}>
      <label className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          aria-label={title}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) onChange(next)
          }}
          className="border-input bg-background h-9 w-24 rounded-lg border px-2 text-sm tabular-nums"
        />
        {suffix && <span className="text-muted-foreground text-xs">{suffix}</span>}
      </label>
    </SettingRow>
  )
}

/** Wraps the rows of one panel with dividers, so panels stay about their fields only. */
export function PanelRows({ children }: { children: React.ReactNode }) {
  return <div className="divide-y">{children}</div>
}
