'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { DAY_OF_WEEK } from '@/constants/day-of-week'
import { DayOfWeekEnum } from '@/enums/day-of-week.enum'
import { ApiResponse } from '@/types/api-response.interface'
import { WeeklyAttendance } from '@/types/dashboard.interfaces'

const chartConfig = {
  presentCount: {
    label: 'حضور',
    color: '#2563eb',
  },
  absentCount: {
    label: 'غایب',
    color: '#60a5fa',
  },
} satisfies ChartConfig

type WeeklyAttendanceChartProps = ApiResponse<WeeklyAttendance[]> & {
  className: string
}

export default function WeeklyAttendanceChart({
  data,
  error,
  className,
}: WeeklyAttendanceChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>نمودار حضور و غیاب هفتگی</CardTitle>
        {!!error && (
          <CardDescription className="text-destructive-foreground flex flex-col text-xs">
            <span>{error.title || 'خطا در دریافت اطلاعات!'}</span>
            <span>{error.detail}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="max-h-[270px] min-h-[200px] w-full"
        >
          <BarChart accessibilityLayer data={data?.slice().reverse()}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="dayOfWeek"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: DayOfWeekEnum) => DAY_OF_WEEK[value]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="presentCount"
              fill="var(--color-presentCount)"
              radius={4}
            />
            <Bar
              dataKey="absentCount"
              fill="var(--color-absentCount)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
