'use client'

import { RotateCcw } from '@/components/icons'

import {
  AppTheme,
  DENSITY_LABEL,
  MUSCLE_MAP_MODE_LABEL,
  MuscleMapMode,
  THEME_LABEL,
  UiDensity,
  optionsOf,
} from '@/app/(tenant)/_model/preferences'

import { ChoiceRow, PanelRows, SettingRow, ToggleRow } from '../panel-parts'

import type { PanelProps } from './types'

const PRIMARY_SWATCHES = [
  '#FB9A3C',
  '#E11D48',
  '#7C3AED',
  '#2563EB',
  '#0D9488',
  '#16A34A',
]

const ACCENT_SWATCHES = [
  '#FDE3C7',
  '#FECDD3',
  '#EDE9FE',
  '#DBEAFE',
  '#CCFBF1',
  '#DCFCE7',
]

function ColorRow({
  title,
  description,
  value,
  fallback,
  swatches,
  onChange,
  onReset,
}: {
  title: string
  description: string
  value: string | null
  fallback: string
  swatches: string[]
  onChange: (value: string | null) => void
  onReset: () => void
}) {
  const current = value ?? fallback

  return (
    <SettingRow title={title} description={description}>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <div className="flex items-center gap-1.5" role="group" aria-label={title}>
          {swatches.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${title}: ${color}`}
              aria-pressed={current.toLowerCase() === color.toLowerCase()}
              onClick={() => onChange(color)}
              className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                current.toLowerCase() === color.toLowerCase()
                  ? 'border-foreground scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <input
          type="color"
          value={current}
          aria-label={`${title} (انتخاب آزاد)`}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="border-input bg-background h-8 w-10 cursor-pointer rounded-md border p-0.5"
        />

        {value && (
          <button
            type="button"
            onClick={onReset}
            aria-label={`بازگردانی ${title} به رنگ باشگاه`}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      </div>
    </SettingRow>
  )
}

export function LookPanel({ draft, update }: PanelProps) {
  return (
    <PanelRows>
      <ChoiceRow
        title="پوسته"
        description="هماهنگ با سیستم، یا همیشه روشن/تیره."
        value={draft.theme}
        options={optionsOf<AppTheme>(THEME_LABEL)}
        onChange={(theme) => update({ theme })}
      />

      <ColorRow
        title="رنگ اصلی"
        description="رنگ دکمه‌ها، لینک‌ها و حلقه‌های پیشرفت. پیش‌فرض، رنگ برند باشگاه است."
        value={draft.primaryColor}
        fallback="#FB9A3C"
        swatches={PRIMARY_SWATCHES}
        onChange={(primaryColor) => update({ primaryColor })}
        onReset={() => update({ primaryColor: null })}
      />

      <ColorRow
        title="رنگ تأکیدی"
        description="پس‌زمینه‌های ملایم و برچسب‌ها؛ بهتر است روشن و کم‌اشباع بماند."
        value={draft.accentColor}
        fallback="#FDE3C7"
        swatches={ACCENT_SWATCHES}
        onChange={(accentColor) => update({ accentColor })}
        onReset={() => update({ accentColor: null })}
      />

      <ChoiceRow
        title="چیدمان"
        description="حالت فشرده فاصله‌ها را کم می‌کند؛ برای گوشی‌های کوچک بهتر است."
        value={draft.density}
        options={optionsOf<UiDensity>(DENSITY_LABEL)}
        onChange={(density) => update({ density })}
      />

      <ChoiceRow
        title="نقشه عضلات"
        description="صفحه عضلات با کدام نمای پیش‌فرض باز شود."
        value={draft.defaultMuscleMap}
        options={optionsOf<MuscleMapMode>(MUSCLE_MAP_MODE_LABEL)}
        onChange={(defaultMuscleMap) => update({ defaultMuscleMap })}
      />

      <ToggleRow
        title="کاهش انیمیشن"
        description="حرکت‌ها و ترنزیشن‌ها کمتر شوند."
        checked={draft.reduceMotion}
        onChange={(reduceMotion) => update({ reduceMotion })}
      />
    </PanelRows>
  )
}
