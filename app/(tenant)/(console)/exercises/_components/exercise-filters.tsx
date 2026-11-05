'use client'

import { Search, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'

import {
  MISSING_EQUIPMENT,
  bodyPartLabel,
  equipmentLabel,
  levelLabel,
} from '../_model/exercise-equipment'
import type { ExerciseEquipmentOption } from '../_model/exercise.types'

interface ExerciseFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  /** Comes from the API, so a new tool in the data appears without a client change. */
  options: ExerciseEquipmentOption[]
  selected: string[]
  onSelectedChange: (next: string[]) => void
  /** Muscle groups (body parts) from the same catalog. */
  bodyParts: ExerciseEquipmentOption[]
  bodyPart: string | null
  onBodyPartChange: (next: string | null) => void
  /** Difficulty values, beginner → expert (only the ones present in the data). */
  levels: ExerciseEquipmentOption[]
  level: string | null
  onLevelChange: (next: string | null) => void
  /** Exercises with no equipment value, offered as their own chip so they can be fixed. */
  missing: number
  onReset: () => void
}

export default function ExerciseFilters({
  search,
  onSearchChange,
  options,
  selected,
  onSelectedChange,
  bodyParts,
  bodyPart,
  onBodyPartChange,
  levels,
  level,
  onLevelChange,
  missing,
  onReset,
}: ExerciseFiltersProps) {
  const toggle = (code: string) =>
    onSelectedChange(
      selected.includes(code)
        ? selected.filter((item) => item !== code)
        : [...selected, code],
    )

  const active =
    selected.length > 0 || bodyPart !== null || level !== null || search.trim().length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="جستجوی حرکت..."
            aria-label="جستجوی حرکات"
            className="bg-background focus:ring-primary h-11 w-full rounded-lg border pr-10 pl-3 text-sm outline-none focus:ring-2"
          />
        </div>

        {active && (
          <button
            type="button"
            onClick={onReset}
            className="focus-visible:ring-ring inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
          >
            <X className="size-4" />
            پاک کردن فیلترها
          </button>
        )}
      </div>

      <ChipRow label="تجهیزات" ariaLabel="فیلتر تجهیزات">
        <FilterChip active={selected.length === 0} onClick={() => onSelectedChange([])}>
          همه
        </FilterChip>

        {options.map((option) => (
          <FilterChip
            key={option.code}
            active={selected.includes(option.code)}
            onClick={() => toggle(option.code)}
          >
            {equipmentLabel(option.code, option.label)}
            <span className="tabular-nums opacity-70">
              {option.count.toLocaleString('fa-IR')}
            </span>
          </FilterChip>
        ))}

        {missing > 0 && (
          <FilterChip
            warn
            active={selected.includes(MISSING_EQUIPMENT)}
            onClick={() => toggle(MISSING_EQUIPMENT)}
          >
            <TriangleAlert className="size-3.5" aria-hidden />
            بدون تجهیزات
            <span className="tabular-nums opacity-70">{missing.toLocaleString('fa-IR')}</span>
          </FilterChip>
        )}
      </ChipRow>

      {bodyParts.length > 0 && (
        <ChipRow label="عضله" ariaLabel="فیلتر عضله">
          <FilterChip active={bodyPart === null} onClick={() => onBodyPartChange(null)}>
            همه
          </FilterChip>

          {bodyParts.map((option) => (
            <FilterChip
              key={option.code}
              active={bodyPart === option.code}
              onClick={() =>
                onBodyPartChange(bodyPart === option.code ? null : option.code)
              }
            >
              {bodyPartLabel(option.code, option.label)}
              <span className="tabular-nums opacity-70">
                {option.count.toLocaleString('fa-IR')}
              </span>
            </FilterChip>
          ))}
        </ChipRow>
      )}

      {levels.length > 0 && (
        <ChipRow label="سطح" ariaLabel="فیلتر سطح دشواری">
          <FilterChip active={level === null} onClick={() => onLevelChange(null)}>
            همه
          </FilterChip>

          {levels.map((option) => (
            <FilterChip
              key={option.code}
              active={level === option.code}
              onClick={() => onLevelChange(level === option.code ? null : option.code)}
            >
              {levelLabel(option.code, option.label)}
              <span className="tabular-nums opacity-70">
                {option.count.toLocaleString('fa-IR')}
              </span>
            </FilterChip>
          ))}
        </ChipRow>
      )}
    </div>
  )
}

function ChipRow({
  label,
  ariaLabel,
  children,
}: {
  label: string
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-1.5 flex shrink-0 items-center gap-1.5 text-xs font-semibold">
        <SlidersHorizontal className="size-3.5" aria-hidden />
        {label}
      </span>

      <div
        role="group"
        aria-label={ariaLabel}
        className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1"
      >
        {children}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  warn = false,
  onClick,
  children,
}: {
  active: boolean
  warn?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`focus-visible:ring-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : warn
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:border-amber-500/70 dark:text-amber-400'
            : 'bg-card hover:border-primary/40'
      }`}
    >
      {children}
    </button>
  )
}
