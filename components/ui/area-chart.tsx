'use client'

import { ChartAreaIcon } from 'lucide-react'
import * as React from 'react'
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/**
 * Generic reusable <AreaChart /> component.
 *
 * The component is **type-safe** – the `xKey` and each `areaKeys` value must
 * exist in the supplied `data` objects.
 *
 * It supports multiple series, stacked or independent, custom formatters and
 * full styling through the existing `ChartConfig` system (label, color, icon …).
 */
export interface AreaChartProps<
  TData extends object,
  XKey extends keyof TData,
  AreaKey extends keyof TData,
> extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Raw chart data */
  data: readonly TData[]
  /** Key of the x-axis value inside `data` objects (usually a date/string). */
  xKey: XKey
  /** Keys that will be represented as individual <Area /> series. */
  areaKeys: readonly AreaKey[]
  /** Chart configuration object (labels, colors …). */
  config: ChartConfig
  /** Height of the chart (default: 280). */
  height?: number
  /**
   * Optional formatter function that converts the raw x value to a string for
   * axis ticks.
   */
  xAxisFormatter?: (value: TData[XKey]) => string
  /** Optional formatter for tooltip title (first line) */
  tooltipLabelFormatter?: (value: TData[XKey]) => string
  /** Optional formatter for y values in tooltip */
  valueFormatter?: (value: string) => string | React.ReactNode
  /**
   * Whether the areas should share the same stack (defaults to false – not
   * stacked). When `true` all areas will be stacked on top of each other.
   */
  stacked?: boolean
  /** no data message text **/
  emptyMessage?: string
  /** The recharts line type (default: 'monotone'). */
  curveType?:
    | 'monotone'
    | 'linear'
    | 'natural'
    | 'basis'
    | 'step'
    | 'stepBefore'
    | 'stepAfter'
}

export function AreaChart<
  TData extends object,
  XKey extends keyof TData,
  AreaKey extends keyof TData,
>(props: AreaChartProps<TData, XKey, AreaKey>) {
  const {
    data,
    xKey,
    areaKeys,
    config,
    height = 280,
    xAxisFormatter,
    tooltipLabelFormatter,
    valueFormatter,
    stacked = false,
    curveType = 'monotone',
    emptyMessage = '',
    className,
    ...rest
  } = props

  // Generate a deterministic gradient id based on React id to avoid collisions
  const uniqueId = React.useId()
  const isMobile = useIsMobile()

  /** Build gradients once – they are purely presentational. */
  const gradients = React.useMemo(() => {
    return areaKeys.map((key) => {
      const gradientId = `fill-${String(key)}-${uniqueId}`
      const cssVar = `var(--color-${String(key)})`
      return { key, gradientId, cssVar }
    })
  }, [areaKeys, uniqueId])

  return (
    <ChartContainer
      {...rest}
      config={config}
      className={cn('w-full', className)}
      style={{ height }}
    >
      {data?.length > 0 ? (
        <RechartsAreaChart
          data={data as unknown[]}
          margin={{ top: 15, bottom: 15 }}
        >
          {/* Grid & axes */}
          <CartesianGrid vertical={false} />
          {!isMobile && <YAxis tickMargin={8} />}
          <XAxis
            dataKey={String(xKey)}
            // axisLine={false}
            tickMargin={8}
            minTickGap={4}
            tickFormatter={(value: unknown) =>
              xAxisFormatter
                ? xAxisFormatter(value as TData[XKey])
                : String(value)
            }
          />

          {/* Tooltip */}
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                valueFormatter={valueFormatter}
                labelFormatter={(v: unknown) =>
                  tooltipLabelFormatter
                    ? tooltipLabelFormatter(v as TData[XKey])
                    : String(v)
                }
              />
            }
          />

          {/* Gradients definitions */}
          <defs>
            {gradients.map(({ gradientId, cssVar }) => (
              <linearGradient
                key={gradientId}
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={cssVar} stopOpacity={0.8} />
                <stop offset="95%" stopColor={cssVar} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>

          {/* Series */}
          {gradients.map(({ key, gradientId, cssVar }) => (
            <Area
              key={String(key)}
              dataKey={String(key)}
              type={curveType}
              fill={`url(#${gradientId})`}
              stroke={cssVar}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}

          {/* Legend */}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsAreaChart>
      ) : (
        <Card className="h-full items-center justify-center border-none">
          <CardContent className="flex flex-col items-center justify-center px-6 py-6 text-center">
            <div className="bg-muted mb-4 rounded-full p-4">
              <ChartAreaIcon className="text-muted-foreground h-8 w-8" />
            </div>

            <h3 className="text-foreground mb-2 text-lg font-semibold">
              {emptyMessage}
            </h3>

            <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
              اطلاعاتی جهت نمایش یافت نشد
            </p>
          </CardContent>
        </Card>
      )}
    </ChartContainer>
  )
}
