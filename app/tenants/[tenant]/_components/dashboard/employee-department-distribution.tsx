'use client'

import { PieChartIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Pie, PieChart } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ApiResponse } from '@/types/api-response.interface'
import { EmployeesDistribution } from '@/types/dashboard.interfaces'

type ProcessedChartData = EmployeesDistribution & { fill: string }

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--success)',
  'var(--warning)',
  'var(--info)',
  'var(--destructive)',
] as const

type EmployeeDepartmentDistributionProps = ApiResponse<
  EmployeesDistribution[]
> & { className: string }

export default function EmployeeDepartmentDistribution({
  className,
  data,
  error,
}: EmployeeDepartmentDistributionProps) {
  const { chartConfig, chartData } = useMemo(() => {
    const config: ChartConfig = {}
    const processedData: ProcessedChartData[] = []

    data?.forEach((department, index) => {
      // Use modulo to cycle through colors if departments exceed available colors
      const colorIndex = index % CHART_COLORS.length
      const color = CHART_COLORS[colorIndex]

      // Build dynamic chart config
      config[department.departmentId] = {
        label: department.departmentName,
        color: color,
      }

      // Build processed chart data with computed fill color
      processedData.push({
        departmentId: department.departmentId,
        departmentName: department.departmentName,
        staffCount: department.staffCount,
        fill: color,
      })
    })

    return { chartConfig: config, chartData: processedData }
  }, [data])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>توزیع کارمندان بر اساس بخش</CardTitle>
      </CardHeader>
      <CardContent>
        {!!error ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PieChartIcon />
              </EmptyMedia>
              <EmptyTitle className="text-destructive-foreground">
                خطا در دریافت اطلاعات!
              </EmptyTitle>
              <EmptyDescription>{error.detail}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[240px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={chartData.map((data) => ({
                    ...data,
                    fill: data.fill,
                  }))}
                  dataKey="staffCount"
                  nameKey="departmentId"
                  labelLine={false}
                  label
                  paddingAngle={2}
                  innerRadius={60}
                  outerRadius={90}
                />
              </PieChart>
            </ChartContainer>
            {/* custom chart legend*/}
            <div className="flex flex-wrap items-center justify-center gap-x-2">
              {Object.entries(chartConfig).map(([key, value]) => (
                <div key={key} className="flex items-center gap-x-1">
                  <div
                    className="size-2 rounded-xs"
                    style={{ backgroundColor: value.color }}
                  />
                  <span className="text-muted-foreground text-xs">
                    {value.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
