'use client'

import { LoaderIcon } from 'lucide-react'
import { useState } from 'react'

import { useGetCalendarInfo } from '@/app/tenants/[tenant]/_api/use-get-calendar-info'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DashboardCalendar } from '@/components/ui/dashboard-calendar'
import { cn } from '@/lib/utils'
import { formatJalaliDate } from '@/utils/date'

export default function AttendanceCalendar({
  className,
}: {
  className: string
}) {
  const [displayMonth, setDisplayMonth] = useState(new Date())

  const month = formatJalaliDate(displayMonth, 'MM')!
  const year = formatJalaliDate(displayMonth, 'yyyy')!

  const { data, error, isLoading, refetch } = useGetCalendarInfo(year, month)
  const monthLabel = displayMonth.toLocaleString('fa-IR', { month: 'short' })
  return (
    <Card className={className}>
      <CardHeader className="text-center md:text-right">
        <CardTitle>{`تقویم حضور و غیاب - ${monthLabel} ${year}`}</CardTitle>
        {!!error && (
          <CardDescription className="text-destructive-foreground mx-auto text-center text-xs">
            <div className="flex flex-col">
              <span>خطا در دریافت اطلاعات تقویم!</span>
              <span>{error.detail}</span>
            </div>
            <Button
              variant="link"
              size="sm"
              type="button"
              onClick={() => refetch()}
            >
              تلاش مجدد
            </Button>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn(isLoading && 'relative')}>
        {isLoading && (
          <LoaderIcon className="absolute top-1/2 right-1/2 size-6 translate-y-1/2 animate-spin" />
        )}
        <DashboardCalendar
          disabled={isLoading}
          events={data}
          id="calendar"
          month={displayMonth}
          mode="single"
          className={cn('w-full', isLoading && 'blur-xs')}
          captionLayout="dropdown"
          showOutsideDays={false}
          onMonthChange={setDisplayMonth}
        />
      </CardContent>
    </Card>
  )
}
