import {
  BriefcaseIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  type LucideIcon,
  UsersIcon,
} from 'lucide-react'
import type React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { readData } from '@/core/http-service'
import { cn } from '@/lib/utils'
import { ApiResponse } from '@/types/api-response.interface'
import type { TodaySummary } from '@/types/dashboard.interfaces'
import type { Problem } from '@/types/http-errors.interface'

const STATISTICS: Record<
  keyof TodaySummary,
  { label: string; icon: LucideIcon; color: string }
> = {
  totalUsers: {
    label: 'کل کارمندان',
    icon: UsersIcon,
    color: 'text-blue-600 dark:text-blue-400',
  },
  presentUsers: {
    label: 'حاضر امروز',
    icon: CheckCircleIcon,
    color: 'text-green-600 dark:text-green-400',
  },
  onMissionUsers: {
    label: 'در ماموریت',
    icon: BriefcaseIcon,
    color: 'text-purple-600 dark:text-purple-400',
  },
  requests: {
    label: 'درخواست‌ها',
    icon: ClipboardListIcon,
    color: 'text-orange-600 dark:text-orange-400',
  },
}

const getTodaySummary = async (): Promise<ApiResponse<TodaySummary>> => {
  try {
    const data = await readData<TodaySummary>('dashboard/today-summary')
    return { data, error: null }
  } catch (err) {
    const error = err as Problem
    return {
      data: null,
      error,
    }
  }
}

export default async function TodaySummaryCards({
  className,
}: {
  className?: string
}) {
  const { data: todaySummary, error } = await getTodaySummary()

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {(
        Object.entries(STATISTICS) as Array<
          [keyof TodaySummary, (typeof STATISTICS)[keyof TodaySummary]]
        >
      ).map(([key, config]) => (
        <StatisticsItemCard
          key={key}
          label={config.label}
          value={todaySummary?.[key]}
          icon={config.icon}
          color={config.color}
          error={error}
        />
      ))}
    </div>
  )
}

type StatisticsItemCardProps = {
  label: React.ReactNode
  value: number | undefined
  icon: LucideIcon
  color: string
  error: Problem | null
}

const StatisticsItemCard = ({
  label,
  value,
  icon: Icon,
  color,
  error,
}: StatisticsItemCardProps) => {
  return (
    <Card
      className={cn(
        'w-full transition-shadow hover:shadow-md',
        !!error && 'shadow-destructive',
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        {!!error ? (
          <div className="text-destructive-foreground flex flex-col gap-0.5 text-xs">
            <span>{error.title || 'خطا'}</span>
            {error.detail}
          </div>
        ) : (
          <div className="text-2xl font-bold">
            {value ? value.toLocaleString('fa-IR') : '-'}
          </div>
        )}
        <div className={cn('bg-muted rounded-lg p-2', color)}>
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  )
}
