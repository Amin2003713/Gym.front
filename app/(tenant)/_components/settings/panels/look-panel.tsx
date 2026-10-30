'use client'

import {
  AppTheme,
  DENSITY_LABEL,
  MUSCLE_MAP_MODE_LABEL,
  MuscleMapMode,
  THEME_LABEL,
  UiDensity,
  optionsOf,
} from '@/app/(tenant)/_model/preferences'

import { ChoiceRow, PanelRows, ToggleRow } from '../panel-parts'

import type { PanelProps } from './types'

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
