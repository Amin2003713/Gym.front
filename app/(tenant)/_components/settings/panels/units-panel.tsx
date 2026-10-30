'use client'

import {
  UNIT_SYSTEM_LABEL,
  UnitSystem,
  optionsOf,
} from '@/app/(tenant)/_model/preferences'

import { ChoiceRow, NumberRow, PanelRows } from '../panel-parts'

import type { PanelProps } from './types'

export function UnitsPanel({ draft, update }: PanelProps) {
  const metric = draft.unitSystem === UnitSystem.Metric

  return (
    <PanelRows>
      <ChoiceRow
        title="واحد اندازه‌گیری"
        description="وزن‌ها در تمرین، اندازه‌گیری بدن و نمودارها با همین واحد نمایش داده می‌شوند."
        value={draft.unitSystem}
        options={optionsOf<UnitSystem>(UNIT_SYSTEM_LABEL)}
        onChange={(unitSystem) => update({ unitSystem })}
      />

      <NumberRow
        title="پله افزایش وزنه"
        description="گام پیشنهادی برای سنگین‌تر کردن ست در صفحه تمرین."
        value={draft.weightIncrement}
        min={0.25}
        max={25}
        step={0.25}
        suffix={metric ? 'کیلوگرم' : 'پوند'}
        onChange={(weightIncrement) => update({ weightIncrement })}
      />
    </PanelRows>
  )
}
