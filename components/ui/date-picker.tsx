import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import RMDatePicker, { DateObject } from 'react-multi-date-picker'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Define interfaces for type safety
interface PureDatePickerProps
  extends Omit<React.ComponentProps<typeof RMDatePicker>, 'value'> {
  value: string | Date
  error?: boolean
}

interface CustomInputProps {
  value: string
  openCalendar: () => void
  handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  locale: typeof persian_fa
  separator: string
  error?: boolean
}

// Constants for date range
const MIN_DATE = new DateObject({ calendar: persian }).subtract(50, 'years')
const MAX_DATE = new DateObject({ calendar: persian }).add(50, 'years')

// Main DatePicker component
export function DatePicker({
  value,
  onChange,
  error,
  ...rest
}: PureDatePickerProps) {
  const formattedValue =
    value && new DateObject(value).convert(persian, persian_fa).format()

  return (
    <RMDatePicker
      calendar={persian}
      locale={persian_fa}
      value={formattedValue}
      onChange={onChange}
      renderButton={renderNavigationButton}
      render={(
        value: string,
        openCalendar: () => void,
        handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        locale: typeof persian_fa,
        separator: string,
      ) =>
        renderCustomInput({
          value,
          openCalendar,
          handleValueChange,
          locale,
          separator,
          error,
        })
      }
      fixMainPosition
      monthYearSeparator=" | "
      minDate={MIN_DATE}
      maxDate={MAX_DATE}
      {...rest}
    />
  )
}

// Custom input renderer
const renderCustomInput = ({
  value,
  openCalendar,
  handleValueChange,
  error,
}: CustomInputProps) => (
  <div className="group relative">
    <Input
      value={value}
      aria-invalid={error}
      onClick={openCalendar}
      onFocus={openCalendar}
      onChange={handleValueChange}
      dir="ltr"
    />
    <CalendarIcon
      className="text-muted-foreground group-focus-within:text-foreground absolute top-2 right-2 h-4 w-4 cursor-pointer md:h-5 md:w-5"
      onClick={openCalendar}
    />
  </div>
)

// Navigation button renderer
const renderNavigationButton = (
  direction: 'right' | 'left',
  handleClick: () => void,
) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="sm" variant="ghost" onClick={handleClick}>
        {direction === 'right' ? <ChevronLeft /> : <ChevronRight />}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{direction === 'right' ? 'بعدی' : 'قبلی'}</p>
    </TooltipContent>
  </Tooltip>
)
