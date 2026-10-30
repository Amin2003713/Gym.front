'use client'

import { EQUIPMENT_OPTIONS } from '@/app/(tenant)/_model/preferences'

import type { PanelProps } from './types'

/** Equipment the member can train with; an empty selection means "no restriction". */
export function EquipmentPanel({ draft, update }: PanelProps) {
  const toggle = (code: string) => {
    const selected = draft.equipment.includes(code)
      ? draft.equipment.filter((item) => item !== code)
      : [...draft.equipment, code]

    update({ equipment: selected })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EQUIPMENT_OPTIONS.map((option) => {
          const active = draft.equipment.includes(option.code)

          return (
            <button
              key={option.code}
              type="button"
              onClick={() => toggle(option.code)}
              aria-pressed={active}
              className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs leading-5">
          {draft.equipment.length === 0
            ? 'هیچ تجهیزاتی انتخاب نشده؛ حرکات بدون محدودیت پیشنهاد می‌شوند.'
            : `${draft.equipment.length} تجهیز انتخاب شده است.`}
        </p>
        {draft.equipment.length > 0 && (
          <button
            type="button"
            onClick={() => update({ equipment: [] })}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold"
          >
            پاک کردن
          </button>
        )}
      </div>
    </div>
  )
}
