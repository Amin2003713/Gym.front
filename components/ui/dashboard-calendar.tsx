'use client'

import { isPast, isToday } from 'date-fns'
import { addYears, format, subYears } from 'date-fns-jalali'
import {
  BellRing,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import * as React from 'react'
import {
  type DayButton,
  type DropdownProps,
  getDefaultClassNames,
} from 'react-day-picker'
import { DayPicker } from 'react-day-picker/persian'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { CalendarInfo } from '@/types/dashboard.interfaces'

export function DashboardCalendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  events,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
  events?: CalendarInfo[]
}) {
  const defaultClassNames = getDefaultClassNames()

  const now = new Date()
  const startMonth = subYears(now, 15) // past
  const endMonth = addYears(now, 10) // future

  return (
    <>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn(
          'bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
          String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
          String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
          className,
        )}
        startMonth={startMonth}
        endMonth={endMonth}
        captionLayout={captionLayout}
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString('fa-IR', { month: 'short' }),
          ...formatters,
        }}
        classNames={{
          root: cn('w-fit', defaultClassNames.root),
          months: cn(
            'relative flex flex-col gap-4 md:flex-row',
            defaultClassNames.months,
          ),
          month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
          nav: cn(
            'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
            defaultClassNames.nav,
          ),
          button_previous: cn(
            buttonVariants({ variant: buttonVariant }),
            'size-(--cell-size) size-fit p-1 select-none aria-disabled:opacity-50',
            defaultClassNames.button_previous,
          ),
          button_next: cn(
            buttonVariants({ variant: buttonVariant }),
            'size-(--cell-size) size-fit p-1 select-none aria-disabled:opacity-50',
            defaultClassNames.button_next,
          ),
          month_caption: cn(
            'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
            defaultClassNames.month_caption,
          ),
          dropdowns: cn(
            defaultClassNames.dropdowns,
            'z-20 flex h-(--cell-size) w-full items-center justify-center gap-1.5 font-medium lg:text-sm',
          ),
          dropdown_root: cn(
            'has-focus:border-ring border-input has-focus:ring-ring/50 relative rounded-md border shadow-xs has-focus:ring-[3px]',
            'bg-background text-foreground',
            defaultClassNames.dropdown_root,
          ),
          dropdown: cn(
            'bg-background text-foreground absolute inset-0.5',
            'dark:bg-background dark:text-foreground',
            defaultClassNames.dropdown,
          ),
          caption_label: cn(
            'font-medium select-none',
            captionLayout === 'label'
              ? 'text-sm'
              : 'flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5',
            defaultClassNames.caption_label,
          ),
          table: 'w-full border-collapse',
          weekdays: cn('flex', defaultClassNames.weekdays),
          weekday: cn(
            'text-muted-foreground flex-1 rounded-md text-[0.8rem] font-normal select-none',
            defaultClassNames.weekday,
          ),
          week: cn('mt-1 flex w-full gap-x-1', defaultClassNames.week),
          week_number_header: cn(
            'w-(--cell-size) select-none',
            defaultClassNames.week_number_header,
          ),
          week_number: cn(
            'text-muted-foreground text-[0.8rem] select-none',
            defaultClassNames.week_number,
          ),
          day: cn(
            'group/day border-0.5 relative min-h-14 w-full rounded-md border p-0 text-center select-none sm:min-h-20 [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
            defaultClassNames.day,
          ),
          range_start: cn(
            'bg-accent rounded-l-md',
            defaultClassNames.range_start,
          ),
          range_middle: cn('rounded-none', defaultClassNames.range_middle),
          range_end: cn('bg-accent rounded-r-md', defaultClassNames.range_end),
          today: cn('', defaultClassNames.today),
          outside: cn(
            'text-muted-foreground aria-selected:text-muted-foreground',
            defaultClassNames.outside,
          ),
          disabled: cn(
            'text-muted-foreground opacity-50',
            defaultClassNames.disabled,
          ),
          hidden: cn('invisible', defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Root: ({ className, rootRef, ...props }) => {
            return (
              <div
                data-slot="calendar"
                ref={rootRef}
                className={cn(className)}
                {...props}
              />
            )
          },
          Dropdown: CalendarDropDown,
          Chevron: ({ className, orientation, ...props }) => {
            if (orientation === 'left') {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="z-30 flex flex-1 items-center gap-1 p-1">
                      <ChevronRightIcon
                        className={cn('size-4', className)}
                        {...props}
                      />
                      <span className="hidden xl:inline">ماه قبل</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ماه قبل</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            if (orientation === 'right') {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="z-30 flex flex-row-reverse items-center gap-1 p-1">
                      <ChevronLeftIcon
                        className={cn('size-4', className)}
                        {...props}
                      />
                      <span className="hidden xl:inline">ماه بعد</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ماه بعد</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <ChevronDownIcon className={cn('size-4', className)} {...props} />
            )
          },
          DayButton: (dayProps) => (
            <CalendarDayButton events={events} {...dayProps} />
          ),
          WeekNumber: ({ children, ...props }) => {
            return (
              <td {...props}>
                <div className="flex size-(--cell-size) items-center justify-center text-center">
                  {children}
                </div>
              </td>
            )
          },
          ...components,
        }}
        {...props}
      />
      <CalendarHints />
    </>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  events,
  ...props
}: React.ComponentProps<typeof DayButton> & { events?: CalendarInfo[] }) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const event = events?.find(
    (event) =>
      format(event.date, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd'),
  )

  return (
    <>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        data-day={day.date.toLocaleDateString()}
        data-selected-single={
          modifiers.selected &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle
        }
        data-range-start={modifiers.range_start}
        data-range-end={modifiers.range_end}
        data-range-middle={modifiers.range_middle}
        className={cn(
          'flex h-auto min-h-14 w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 sm:min-h-20',
          (event?.isHoliday || event?.isCustomHoliday) &&
            '!bg-destructive/20 font-bold dark:!bg-red-950',
          className,
        )}
        {...props}
      >
        <div className="group-data-[today=true]/day:bg-info w-3/4 rounded-md text-xs leading-tight font-medium group-data-[today=true]/day:p-0.5 md:text-sm">
          {format(day.date, 'd')}
        </div>

        {event?.presentCount !== undefined && (
          <span
            className="text-xs leading-tight font-semibold text-green-600 dark:text-green-400"
            aria-label={`${event.presentCount} حاضر`}
          >
            {event.presentCount}
          </span>
        )}

        {event?.absentCount !== undefined && (
          <span
            className="text-xs leading-tight font-semibold text-red-600 dark:text-red-400"
            aria-label={`${event.absentCount} غایب`}
          >
            {event.absentCount}
          </span>
        )}
      </Button>

      {event?.hasReminder && (
        <BellRing
          className={cn(
            'absolute top-1 left-1 z-40 size-3 animate-ping stroke-orange-700 sm:size-4',
            isPast(event.date) &&
              !isToday(event.date) &&
              'stroke-muted-foreground animate-none',
          )}
        />
      )}

      {event?.isCustomHoliday && (
        <div className="absolute top-1 right-1 z-30 size-2 rounded-full bg-red-400 sm:size-3" />
      )}
    </>
  )
}

function CalendarDropDown(props: DropdownProps) {
  const { options, value, onChange } = props

  const handleValueChange = (newValue: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: {
          value: newValue,
        },
      } as React.ChangeEvent<HTMLSelectElement>

      onChange(syntheticEvent)
    }
  }

  return (
    <Select value={value?.toString()} onValueChange={handleValueChange}>
      <SelectTrigger className="z-30">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options?.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              disabled={option.disabled}
              className="!text-xs"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function CalendarHints() {
  return (
    <div className="flex w-full flex-row items-center justify-center gap-3 p-2 md:gap-6">
      <div className="flex items-center gap-1">
        <span className="block size-3 rounded-full bg-green-600 text-xs sm:size-4 dark:bg-green-400" />
        <span className="text-xs">حاضر</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="block size-3 rounded-full bg-red-600 text-xs sm:size-4 dark:bg-red-400" />
        <span className="text-xs">غایب</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="bg-info block size-3 rounded-full text-xs sm:size-4" />
        <span className="text-xs">امروز</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="bg-destructive/20 block size-3 rounded-full sm:size-4 dark:bg-red-950" />
        <span className="text-xs">تعطیل</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="relative flex h-4 w-7 rounded border">
          <span className="top-0.7 absolute right-0.5 block size-2 rounded-full bg-red-400" />
        </div>
        <span className="text-xs">تعطیلی شخصی</span>
      </div>
    </div>
  )
}
