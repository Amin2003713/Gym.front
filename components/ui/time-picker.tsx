'use client'

import { Clock, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Scroller } from '@/components/ui/scroller'
import { cn } from '@/lib/utils'
import {
  type TimeFormat,
  type TimeValue,
  formatTimeValue,
  parseTimeString,
  generateHours,
  generateMinutes,
} from '@/utils/time-utils'

export interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  format?: TimeFormat
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
  clearable?: boolean
}

export function TimePicker({
  value = '',
  onChange,
  format = '24',
  placeholder = 'انتخاب زمان',
  disabled = false,
  className,
  error = false,
  clearable = true,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const [selectedTime, setSelectedTime] = React.useState<TimeValue>(() => {
    const parsed = parseTimeString(value, format)
    return (
      parsed || {
        hour: format === '12' ? 12 : 0,
        minute: 0,
        period: format === '12' ? 'AM' : undefined,
      }
    )
  })

  const hourScrollRef = React.useRef<HTMLDivElement>(null)
  const minuteScrollRef = React.useRef<HTMLDivElement>(null)

  const hours = React.useMemo(() => generateHours(format), [format])
  const minutes = React.useMemo(() => generateMinutes(), [])

  // Sync external value changes
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value)
      const parsed = parseTimeString(value, format)
      if (parsed) {
        setSelectedTime(parsed)
      }
    }
  }, [value, format, inputValue])

  // Scroll to selected values when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        const hourIndex = hours.indexOf(selectedTime.hour)
        const minuteIndex = selectedTime.minute

        if (hourScrollRef.current && hourIndex !== -1) {
          const wrapperDiv = hourScrollRef.current.children[0] as HTMLElement
          if (wrapperDiv) {
            const hourElement = wrapperDiv.children[hourIndex] as HTMLElement
            if (hourElement) {
              hourElement.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
              })
            }
          }
        }

        if (minuteScrollRef.current) {
          const wrapperDiv = minuteScrollRef.current.children[0] as HTMLElement
          if (wrapperDiv) {
            const minuteElement = wrapperDiv.children[
              minuteIndex
            ] as HTMLElement
            if (minuteElement) {
              minuteElement.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
              })
            }
          }
        }
      }, 100)
    }
  }, [open, selectedTime, hours])

  const handleHourSelect = React.useCallback(
    (hour: number) => {
      const newTime = { ...selectedTime, hour }
      setSelectedTime(newTime)
      const formatted = formatTimeValue(newTime, format)
      setInputValue(formatted)
      onChange?.(formatted)
    },
    [selectedTime, format, onChange],
  )

  const handleMinuteSelect = React.useCallback(
    (minute: number) => {
      const newTime = { ...selectedTime, minute }
      setSelectedTime(newTime)
      const formatted = formatTimeValue(newTime, format)
      setInputValue(formatted)
      onChange?.(formatted)
    },
    [selectedTime, format, onChange],
  )

  const handlePeriodToggle = React.useCallback(() => {
    if (format !== '12') return

    const newPeriod = selectedTime.period === 'AM' ? 'PM' : 'AM'
    const newTime = {
      ...selectedTime,
      period: newPeriod as TimeValue['period'],
    }
    setSelectedTime(newTime)
    const formatted = formatTimeValue(newTime, format)
    setInputValue(formatted)
    onChange?.(formatted)
  }, [selectedTime, format, onChange])

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)

      const parsed = parseTimeString(newValue, format)
      if (parsed) {
        setSelectedTime(parsed)
        onChange?.(newValue)
      }
    },
    [format, onChange],
  )

  const handleInputBlur = React.useCallback(() => {
    const parsed = parseTimeString(inputValue, format)
    if (parsed) {
      const formatted = formatTimeValue(parsed, format)
      setInputValue(formatted)
      onChange?.(formatted)
    } else if (inputValue) {
      const formatted = formatTimeValue(selectedTime, format)
      setInputValue(formatted)
    }
  }, [inputValue, format, selectedTime, onChange])

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setInputValue('')
      setSelectedTime({
        hour: format === '12' ? 12 : 0,
        minute: 0,
        period: format === '12' ? 'AM' : undefined,
      })
      onChange?.('')
    },
    [format, onChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <InputGroup
          className={cn('cursor-pointer', className)}
          data-disabled={disabled}
        >
          {clearable && inputValue && !disabled && (
            <InputGroupAddon align="inline-start">
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear time"
              >
                <X className="size-4" />
              </button>
            </InputGroupAddon>
          )}
          <InputGroupAddon align="inline-start">
            <Clock className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error}
            className="cursor-pointer"
            readOnly={false}
          />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('[data-slot="scroller"]')) {
            e.preventDefault()
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('[data-slot="scroller"]')) {
            e.preventDefault()
          }
        }}
      >
        <div className="flex gap-2 p-3">
          {/* Minute Scroller */}
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-center text-xs font-medium">
              دقیقه
            </div>
            <Scroller
              ref={minuteScrollRef}
              className="h-[200px] w-[70px] rounded-md border"
              hideScrollbar
              withNavigation
              scrollTriggerMode="press"
              style={{ touchAction: 'pan-y' }}
            >
              <div
                className="flex flex-col py-1"
                style={{ touchAction: 'pan-y' }}
              >
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteSelect(minute)}
                    className={cn(
                      'hover:bg-accent flex h-[40px] items-center justify-center text-sm transition-colors',
                      selectedTime.minute === minute &&
                        'bg-primary text-primary-foreground hover:bg-primary/90 font-medium',
                    )}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </Scroller>
          </div>

          {/* Hour Scroller */}
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-center text-xs font-medium">
              ساعت
            </div>
            <Scroller
              ref={hourScrollRef}
              className="h-[200px] w-[70px] rounded-md border"
              hideScrollbar
              withNavigation
              scrollTriggerMode="press"
              style={{ touchAction: 'pan-y' }}
            >
              <div
                className="flex flex-col py-1"
                style={{ touchAction: 'pan-y' }}
              >
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourSelect(hour)}
                    className={cn(
                      'hover:bg-accent flex h-[40px] items-center justify-center text-sm transition-colors',
                      selectedTime.hour === hour &&
                        'bg-primary text-primary-foreground hover:bg-primary/90 font-medium',
                    )}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </Scroller>
          </div>

          {/* AM/PM Toggle for 12-hour format */}
          {format === '12' && (
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground text-center text-xs font-medium">
                Period
              </div>
              <div className="flex h-[200px] w-[70px] flex-col items-center justify-center gap-2 rounded-md border p-2">
                <Button
                  type="button"
                  variant={selectedTime.period === 'AM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handlePeriodToggle}
                  className="w-full"
                >
                  AM
                </Button>
                <Button
                  type="button"
                  variant={selectedTime.period === 'PM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handlePeriodToggle}
                  className="w-full"
                >
                  PM
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
