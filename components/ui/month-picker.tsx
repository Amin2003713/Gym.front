'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Persian month names
const PERSIAN_MONTHS = [
  { value: '01', label: 'فروردین' },
  { value: '02', label: 'اردیبهشت' },
  { value: '03', label: 'خرداد' },
  { value: '04', label: 'تیر' },
  { value: '05', label: 'مرداد' },
  { value: '06', label: 'شهریور' },
  { value: '07', label: 'مهر' },
  { value: '08', label: 'آبان' },
  { value: '09', label: 'آذر' },
  { value: '10', label: 'دی' },
  { value: '11', label: 'بهمن' },
  { value: '12', label: 'اسفند' },
] as const

interface JalaliMonthPickerProps {
  value?: number | string
  onChange?: (month: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function JalaliMonthPicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'انتخاب ماه',
}: JalaliMonthPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleMonthSelect = React.useCallback(
    (monthIndex: string) => {
      onChange?.(monthIndex)
      setOpen(false)
    },
    [onChange],
  )

  const displayValue = React.useMemo(() => {
    if (!value || Number(value) < 1 || Number(value) > 12) return placeholder
    return PERSIAN_MONTHS[Number(value) - 1].label
  }, [value, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="انتخاب ماه"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-right font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="grid grid-cols-3 gap-2 p-3">
          {PERSIAN_MONTHS.map((month) => {
            const isSelected = value === month.value

            return (
              <Button
                key={month.value}
                variant={isSelected ? 'default' : 'ghost'}
                className={cn(
                  'h-9 text-sm font-medium',
                  isSelected && 'bg-primary text-primary-foreground',
                )}
                onClick={() => handleMonthSelect(month.value)}
                aria-label={`انتخاب ${month}`}
              >
                {month.label}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
