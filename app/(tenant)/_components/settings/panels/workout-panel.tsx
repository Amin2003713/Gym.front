'use client'

import { NumberRow, PanelRows, ToggleRow } from '../panel-parts'

import type { PanelProps } from './types'

export function WorkoutPanel({ draft, update }: PanelProps) {
  return (
    <PanelRows>
      <NumberRow
        title="استراحت پیش‌فرض"
        description="وقتی خود حرکت استراحت مشخصی ندارد، این مقدار استفاده می‌شود."
        value={draft.defaultRestSeconds}
        min={0}
        max={900}
        step={15}
        suffix="ثانیه"
        onChange={(defaultRestSeconds) => update({ defaultRestSeconds })}
      />

      <ToggleRow
        title="شروع خودکار تایمر استراحت"
        description="با ثبت هر ست، تایمر استراحت خودش شروع می‌شود."
        checked={draft.autoStartRestTimer}
        onChange={(autoStartRestTimer) => update({ autoStartRestTimer })}
      />

      <ToggleRow
        title="نمایش RIR"
        description="هدف RIR هر ست کنار آن نشان داده می‌شود."
        checked={draft.showRir}
        onChange={(showRir) => update({ showRir })}
      />
    </PanelRows>
  )
}
