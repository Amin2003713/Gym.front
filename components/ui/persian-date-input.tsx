'use client'

import gregorian from 'react-date-object/calendars/gregorian'
import gregorian_en from 'react-date-object/locales/gregorian_en'
import { DateObject } from 'react-multi-date-picker'

import { DatePicker } from '@/components/ui/date-picker'

export interface PersianDateInputProps {
  /** ISO day (`YYYY-MM-DD`), the value the API stores. */
  value: string
  /** Returns the picked day as ISO; empty string when cleared. */
  onValueChange: (isoDate: string) => void
  min?: string
  max?: string
  disabled?: boolean
}

const asDateObject = (iso?: string) => {
  if (!iso) return undefined

  const date = new Date(`${iso}T12:00:00`)

  return Number.isNaN(date.getTime()) ? undefined : new DateObject({ date })
}

/**
 * The Persian date input every form uses. The calendar is Jalali (react-multi-date-picker's
 * persian calendar), but the value crossing the boundary stays an ISO `YYYY-MM-DD` string, so the
 * API and the rest of the app never see a localized date.
 */
export function PersianDateInput({
  value,
  onValueChange,
  min,
  max,
  disabled,
}: PersianDateInputProps) {
  return (
    <DatePicker
      value={value ? `${value}T12:00:00` : ''}
      minDate={asDateObject(min)}
      maxDate={asDateObject(max)}
      disabled={disabled}
      onChange={(selected) => {
        const list = Array.isArray(selected)
          ? (selected as DateObject[])
          : [selected as DateObject]
        const picked = list[0]

        if (!picked || !picked.isValid) {
          onValueChange('')
          return
        }

        onValueChange(picked.convert(gregorian, gregorian_en).format('YYYY-MM-DD'))
      }}
    />
  )
}
