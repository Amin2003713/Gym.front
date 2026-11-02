'use client'

import { EQUIPMENT_OPTIONS } from '@/app/(tenant)/_model/preferences'

import { NumberRow, PanelRows, SettingRow, ToggleRow } from '../panel-parts'

import type { PanelProps } from './types'

export function WorkoutPanel({ draft, update }: PanelProps) {
  const toggleEquipment = (code: string) => {
    const selected = draft.equipment.includes(code)
      ? draft.equipment.filter((item) => item !== code)
      : [...draft.equipment, code]

    update({ equipment: selected })
  }

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

      <SettingRow
        title="تجهیزات من"
        description="اگر چیزی انتخاب نکنی، همه حرکات پیشنهاد می‌شوند. تجهیزات باشگاه در صفحه تجهیزات است."
      >
        <div className="flex flex-wrap justify-end gap-1.5">
          {EQUIPMENT_OPTIONS.map((option) => {
            const active = draft.equipment.includes(option.code)

            return (
              <button
                key={option.code}
                type="button"
                aria-pressed={active}
                onClick={() => toggleEquipment(option.code)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </SettingRow>
    </PanelRows>
  )
}
