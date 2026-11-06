'use client'

import { Search, SlidersHorizontal, TriangleAlert, X } from '@/components/icons'
import { useState } from 'react'

import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MUSCLE_FA } from '@/lib/muscles'

import {
  MISSING_EQUIPMENT,
  bodyPartLabel,
  equipmentLabel,
  levelLabel,
} from '../_model/exercise-equipment'
import type { ExerciseEquipmentOption } from '../_model/exercise.types'

export interface ExerciseFiltersProps {
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
  /** Muscles picked on the body map (slugs from lib/muscles). */
  muscles: string[]
  onMusclesChange: (next: string[]) => void
  /** Exercises with no equipment value, offered as their own chip so they can be fixed. */
  missing: number
  onReset: () => void
}

export default function ExerciseFilters(props: ExerciseFiltersProps) {
  const [open, setOpen] = useState(false)

  const activeCount =
    props.selected.length +
    (props.bodyPart ? 1 : 0) +
    (props.level ? 1 : 0) +
    props.muscles.length +
    (props.search.trim() ? 1 : 0)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />

          <input
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="جستجوی حرکت..."
            aria-label="جستجوی حرکات"
            className="bg-background focus:ring-primary h-11 w-full rounded-lg border pr-10 pl-3 text-sm outline-none focus:ring-2"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 md:hidden"
          onClick={() => setOpen(true)}
          aria-label="باز کردن فیلترهای کتابخانه حرکات"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          فیلترها
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[11px] leading-5 tabular-nums">
              {activeCount.toLocaleString('fa-IR')}
            </span>
          )}
        </Button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={props.onReset}
            className="focus-visible:ring-ring inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
          >
            <X className="size-4" aria-hidden />
            پاک کردن
          </button>
        )}
      </div>

      {/* Desktop keeps the controls inline; phones open the same set inside the dialog. */}
      <div className="hidden space-y-3 md:block">
        <FilterGroups {...props} />
        <MuscleMapFilter muscles={props.muscles} onChange={props.onMusclesChange} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="text-start">
            <DialogTitle>فیلتر حرکات</DialogTitle>
            <DialogDescription>
              تجهیزات، عضله و سطح دشواری را انتخاب کنید؛ نتیجه بلافاصله اعمال می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FilterGroups {...props} />
            <MuscleMapFilter muscles={props.muscles} onChange={props.onMusclesChange} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <button
              type="button"
              onClick={props.onReset}
              className="text-muted-foreground hover:text-foreground inline-flex h-11 items-center rounded-lg px-2 text-sm font-semibold"
            >
              پاک کردن فیلترها
            </button>

            <Button type="button" onClick={() => setOpen(false)} className="h-11">
              نمایش نتیجه
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterGroups({
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
}: ExerciseFiltersProps) {
  const toggle = (code: string) =>
    onSelectedChange(
      selected.includes(code)
        ? selected.filter((item) => item !== code)
        : [...selected, code],
    )

  return (
    <div className="space-y-3">
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

/**
 * Multi-select muscle filter on the body map. The map's `load` prop paints every selected slug,
 * so several muscles can stay highlighted while the list narrows with one `muscleIds` query.
 */
function MuscleMapFilter({
  muscles,
  onChange,
}: {
  muscles: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (slug: string) =>
    onChange(
      muscles.includes(slug)
        ? muscles.filter((item) => item !== slug)
        : [...muscles, slug],
    )

  const load = Object.fromEntries(muscles.map((slug) => [slug, 4]))

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">انتخاب عضله از نقشه بدن</p>

        {muscles.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold"
          >
            پاک کردن عضله‌ها
          </button>
        )}
      </div>

      {muscles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {muscles.map((slug) => (
            <span
              key={slug}
              className="bg-primary/12 text-primary inline-flex items-center gap-1 rounded-full py-1 ps-3 pe-1 text-xs font-semibold"
            >
              {MUSCLE_FA[slug] ?? slug}
              <button
                type="button"
                onClick={() => toggle(slug)}
                aria-label={`حذف ${MUSCLE_FA[slug] ?? slug} از فیلتر`}
                className="hover:bg-primary/20 inline-flex size-6 items-center justify-center rounded-full"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      <BodyMapPanel
        load={load}
        palette="load"
        size="card"
        legend={false}
        onMuscle={toggle}
        className="mx-auto max-w-60"
      />

      <p className="text-muted-foreground mt-2 text-center text-[11px] leading-5">
        روی عضله بزنید تا به فیلتر اضافه یا از آن حذف شود.
      </p>
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
      className={`focus-visible:ring-ring inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 md:h-8 md:text-xs ${
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
