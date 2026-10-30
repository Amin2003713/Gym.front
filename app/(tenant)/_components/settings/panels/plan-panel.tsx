'use client'

import {
  WEEK_START_LABEL,
  WeekStartDay,
  optionsOf,
} from '@/app/(tenant)/_model/preferences'

import { ChoiceRow, PanelRows, ToggleRow } from '../panel-parts'

import type { PanelProps } from './types'

export function PlanPanel({ draft, update }: PanelProps) {
  return (
    <PanelRows>
      <ChoiceRow
        title="شروع هفته تمرین"
        description="نوار هفته در خانه و شبکه هفته در برنامه از همین روز شروع می‌شود."
        value={draft.weekStartsOn}
        options={optionsOf<WeekStartDay>(WEEK_START_LABEL)}
        onChange={(weekStartsOn) => update({ weekStartsOn })}
      />

      <ToggleRow
        title="رفتن خودکار به روز بعد"
        description="بعد از تمام‌شدن یک جلسه برنامه، روز بعدی همان چرخه پیشنهاد می‌شود."
        checked={draft.autoAdvancePlanDay}
        onChange={(autoAdvancePlanDay) => update({ autoAdvancePlanDay })}
      />
    </PanelRows>
  )
}
