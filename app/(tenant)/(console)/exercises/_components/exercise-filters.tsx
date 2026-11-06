'use client'

import { useState } from 'react'

import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import { Search, SlidersHorizontal, TriangleAlert, X } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
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
  resultCount?: number
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
    <div className="space-y-2 md:space-y-3">
      {/* Phone: one 48px search field, one filter button, and a one-tap reset. */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            aria-hidden
          />

          <input
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="جستجوی حرکت..."
            aria-label="جستجوی حرکات"
            inputMode="search"
            enterKeyHint="search"
            className="bg-background focus:ring-primary h-12 w-full rounded-xl border pr-10 pl-3 text-base outline-none focus:ring-2 md:h-11 md:rounded-lg md:text-sm"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-12 shrink-0 gap-2 rounded-xl px-3 md:hidden"
          onClick={() => setOpen(true)}
          aria-label={`باز کردن فیلترهای کتابخانه حرکات${activeCount ? `، ${activeCount.toLocaleString('fa-IR')} فیلتر فعال` : ''}`}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="text-sm font-bold">فیلتر</span>
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
            aria-label="پاک کردن همه فیلترها"
            className="focus-visible:ring-ring inline-flex size-12 shrink-0 items-center justify-center rounded-xl border text-muted-foreground outline-none focus-visible:ring-[3px] md:hidden"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}

        <div className="hidden items-center gap-2 md:flex">
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
      </div>

      {activeCount > 0 && <ActiveFilterSummary {...props} />}

      {/* Desktop keeps every control visible; phones use the sheet below. */}
      <div className="hidden space-y-3 md:block">
        <FilterGroups {...props} />
        <MuscleMapFilter muscles={props.muscles} onChange={props.onMusclesChange} />
      </div>

      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerContent className="max-h-[92svh]">
          <DrawerHeader className="border-b pb-3 text-start">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DrawerTitle>فیلتر حرکات</DrawerTitle>
                <DrawerDescription className="mt-1 leading-6">
                  تجهیزات، عضله و سطح دشواری را انتخاب کنید. نتیجه با بستن این پنجره اعمال
                  می‌شود.
                </DrawerDescription>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن فیلترها"
                className="focus-visible:ring-ring -me-1 inline-flex size-10 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px]"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            <FilterGroups {...props} mobile />
            <MuscleMapFilter muscles={props.muscles} onChange={props.onMusclesChange} />
          </div>

          <DrawerFooter className="flex-row gap-2 border-t bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              onClick={props.onReset}
              className="h-11 shrink-0 px-4"
            >
              پاک کردن
            </Button>

            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 flex-1"
            >
              نمایش {typeof props.resultCount === 'number' ? props.resultCount.toLocaleString('fa-IR') : ''} حرکت
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function ActiveFilterSummary(props: ExerciseFiltersProps) {
  const chips: Array<{ key: string; label: string; remove: () => void }> = []

  props.selected.forEach((code) => {
    const option = props.options.find((item) => item.code === code)
    chips.push({
      key: `equipment-${code}`,
      label: equipmentLabel(code, option?.label ?? code),
      remove: () =>
        props.onSelectedChange(props.selected.filter((item) => item !== code)),
    })
  })

  if (props.bodyPart) {
    const option = props.bodyParts.find((item) => item.code === props.bodyPart)
    chips.push({
      key: `body-${props.bodyPart}`,
      label: bodyPartLabel(props.bodyPart, option?.label ?? props.bodyPart),
      remove: () => props.onBodyPartChange(null),
    })
  }

  if (props.level) {
    const option = props.levels.find((item) => item.code === props.level)
    chips.push({
      key: `level-${props.level}`,
      label: levelLabel(props.level, option?.label ?? props.level),
      remove: () => props.onLevelChange(null),
    })
  }

  props.muscles.forEach((slug) => {
    chips.push({
      key: `muscle-${slug}`,
      label: MUSCLE_FA[slug] ?? slug,
      remove: () =>
        props.onMusclesChange(props.muscles.filter((item) => item !== slug)),
    })
  })

  if (props.search.trim()) {
    chips.push({
      key: 'search',
      label: `جستجو: ${props.search.trim()}`,
      remove: () => props.onSearchChange(''),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1 md:hidden">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="bg-primary/10 text-primary focus-visible:ring-ring inline-flex h-8 shrink-0 items-center gap-1 rounded-full py-0 pr-2.5 pl-1 text-xs font-semibold outline-none focus-visible:ring-[3px]"
          aria-label={`حذف فیلتر ${chip.label}`}
        >
          <span className="max-w-40 truncate">{chip.label}</span>
          <X className="size-3" aria-hidden />
        </button>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={props.onReset}
          className="text-muted-foreground focus-visible:ring-ring inline-flex h-8 shrink-0 items-center rounded-full border px-2.5 text-xs font-semibold outline-none focus-visible:ring-[3px]"
        >
          پاک کردن همه
        </button>
      )}
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
  mobile = false,
}: ExerciseFiltersProps & { mobile?: boolean }) {
  const toggle = (code: string) =>
    onSelectedChange(
      selected.includes(code)
        ? selected.filter((item) => item !== code)
        : [...selected, code],
    )

  return (
    <div className="space-y-4">
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
        <ChipRow label="عضله" ariaLabel="فیلتر عضله" wrap={mobile}>
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
        <ChipRow label="سطح" ariaLabel="فیلتر سطح دشواری" wrap={mobile}>
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
    <div className="rounded-xl border p-3 md:rounded-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">انتخاب عضله از نقشه بدن</p>

        {muscles.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring text-xs font-semibold outline-none focus-visible:ring-[3px]"
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
                className="hover:bg-primary/20 focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]"
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
        className="mx-auto max-w-64"
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
  wrap = false,
  children,
}: {
  label: string
  ariaLabel: string
  wrap?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
        <SlidersHorizontal className="size-3.5" aria-hidden />
        {label}
      </span>

      <div
        role="group"
        aria-label={ariaLabel}
        className={
          wrap
            ? 'flex flex-wrap gap-2'
            : '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]'
        }
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
