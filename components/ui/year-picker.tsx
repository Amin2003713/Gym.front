'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatJalaliDate } from '@/utils/date'

interface JalaliYearPickerProps {
  value?: number
  onChange?: (year: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  minYear?: number
  maxYear?: number
  yearsPerPage?: number
}

export function JalaliYearPicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'انتخاب سال',
  minYear = 1382,
  maxYear = Number(formatJalaliDate(new Date(), 'yyyy')!),
  yearsPerPage = 12,
}: JalaliYearPickerProps) {
  const [open, setOpen] = React.useState(false)

  // Calculate the starting year for the current page
  const [pageStartYear, setPageStartYear] = React.useState(() => {
    if (value) {
      return (
        Math.floor((value - minYear) / yearsPerPage) * yearsPerPage + minYear
      )
    }
    const currentJalaliYear = new Date().getFullYear() - 621
    return (
      Math.floor((currentJalaliYear - minYear) / yearsPerPage) * yearsPerPage +
      minYear
    )
  })

  const years = React.useMemo(() => {
    const yearList: number[] = []
    for (let i = 0; i < yearsPerPage; i++) {
      const year = pageStartYear + i
      if (year >= minYear && year <= maxYear) {
        yearList.push(year)
      }
    }
    return yearList
  }, [pageStartYear, minYear, maxYear, yearsPerPage])

  const handleYearSelect = React.useCallback(
    (year: number) => {
      onChange?.(year.toString())
      setOpen(false)
    },
    [onChange],
  )

  const handlePageChange = React.useCallback(
    (direction: 'prev' | 'next') => {
      setPageStartYear((prev) => {
        const newStart =
          direction === 'prev' ? prev - yearsPerPage : prev + yearsPerPage
        return Math.max(minYear, Math.min(maxYear - yearsPerPage + 1, newStart))
      })
    },
    [minYear, maxYear, yearsPerPage],
  )

  const displayValue = React.useMemo(() => {
    return value ? value.toString() : placeholder
  }, [value, placeholder])

  const canGoPrev = pageStartYear > minYear
  const canGoNext = pageStartYear + yearsPerPage <= maxYear

  const yearRangeLabel = React.useMemo(() => {
    const lastYear = Math.min(pageStartYear + yearsPerPage - 1, maxYear)
    return `${lastYear} - ${pageStartYear}`
  }, [pageStartYear, maxYear, yearsPerPage])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          dir="ltr"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="انتخاب سال"
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
        <div className="flex flex-col">
          {/* Year range navigation header */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handlePageChange('next')}
              disabled={!canGoNext}
              aria-label="سال‌های بعدی"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold tabular-nums">
              {yearRangeLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handlePageChange('prev')}
              disabled={!canGoPrev}
              aria-label="سال‌های قبلی"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Year grid */}
          <div className="grid grid-cols-3 gap-2 p-3" dir="ltr">
            {years.map((year) => {
              const isSelected = value?.toString() === year.toString()

              return (
                <Button
                  key={year}
                  variant={isSelected ? 'default' : 'ghost'}
                  className={cn(
                    'h-9 text-sm font-medium tabular-nums',
                    isSelected && 'bg-primary text-primary-foreground',
                  )}
                  onClick={() => handleYearSelect(year)}
                  aria-label={`انتخاب سال ${year}`}
                >
                  {year}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
