'use client'

import {
  CalendarIcon,
  ClockIcon,
  BuildingIcon,
  TimerIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  InfoIcon,
} from 'lucide-react'
import type React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { DAY_OF_WEEK } from '@/constants/day-of-week'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types/plan.interface'

type ViewPlanDialogProps = {
  open: boolean
  onOpenChange(state: boolean): void
  plan: Plan
}

type InfoItemProps = {
  label: string
  value: string | number | null | undefined
  icon?: React.ReactNode
  className?: string
}

function InfoItem({ label, value, icon, className }: InfoItemProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-foreground text-sm font-semibold">
        {value || (
          <span className="text-muted-foreground font-normal">تعریف نشده</span>
        )}
      </div>
    </div>
  )
}

export default function ViewPlanDialog({
  open,
  onOpenChange,
  plan,
}: ViewPlanDialogProps) {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('fa-IR')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle className="flex items-center justify-center gap-2 sm:justify-start">
            <InfoIcon className="size-5" />
            جزئیات برنامه
          </DialogTitle>
          <DialogDescription>
            مشاهده اطلاعات کامل برنامه {`"${plan.name}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BuildingIcon className="size-4" />
                اطلاعات پایه
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem
                label="نام برنامه"
                value={plan.name}
                icon={<InfoIcon className="size-3.5" />}
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <BuildingIcon className="size-3.5" />
                  <span>بخش‌ها / دپارتمان‌ها</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.departments && plan.departments.length > 0 ? (
                    plan.departments.map((dept) => (
                      <Badge key={dept.id} variant="outline">
                        {dept.title}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      بدون بخش
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarIcon className="size-4" />
                تاریخ و زمان
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem
                label="تاریخ شروع"
                value={formatDate(plan.startDate)}
                icon={<CalendarIcon className="size-3.5" />}
              />
              <InfoItem
                label="تاریخ پایان"
                value={formatDate(plan.endDate)}
                icon={<CalendarIcon className="size-3.5" />}
              />
              <InfoItem
                label="ساعت شروع"
                value={plan.startTime ?? '--'}
                icon={<ClockIcon className="size-3.5" />}
              />
              <InfoItem
                label="ساعت پایان"
                value={plan.endTime ?? '--'}
                icon={<ClockIcon className="size-3.5" />}
              />
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TimerIcon className="size-4" />
                تنظیمات زمانی
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <InfoItem
                label="فرجه ورود"
                value={plan.entryDeadlineTime ?? '--:--'}
                icon={<ClockIcon className="size-3.5" />}
              />
              <InfoItem
                label="فرجه خروج"
                value={plan.exitDeadlineTime ?? '--:--'}
                icon={<ClockIcon className="size-3.5" />}
              />
              <InfoItem
                label="زمان استراحت"
                value={plan.restTime ?? '--:--'}
                icon={<TimerIcon className="size-3.5" />}
              />
              <InfoItem
                label="حداکثر ساعت اضافه‌کار"
                value={plan.maximumOvertimeTime ?? '--:--'}
                icon={<TrendingUpIcon className="size-3.5" />}
              />
            </CardContent>
          </Card>

          {/* Overtime Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUpIcon className="size-4" />
                ضرایب اضافه‌کار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <InfoItem
                  label="ضریب اضافه‌کاری عادی"
                  value={plan.normalOvertimeRate}
                  icon={<TrendingUpIcon className="size-3.5" />}
                />
                <InfoItem
                  label="ضریب اضافه‌کاری تعطیلات"
                  value={plan.holidayOvertimeRate}
                  icon={<TrendingUpIcon className="size-3.5" />}
                />
              </div>

              {plan.overtimeRates && plan.overtimeRates.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                      ضرایب شخصی‌سازی شده
                    </h4>
                    <div className="space-y-3">
                      {plan.overtimeRates.map((rate, index) => (
                        <Card
                          key={index}
                          className="bg-muted/30 border-muted-foreground/20"
                        >
                          <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
                            <div className="flex items-center gap-2 md:col-span-4">
                              <Badge variant="outline" className="text-xs">
                                ضریب {index + 1}
                              </Badge>
                              {rate.isLeaveConsidered && (
                                <Badge
                                  variant="secondary"
                                  className="bg-accent text-accent-foreground text-xs"
                                >
                                  مرخصی سازمانی
                                </Badge>
                              )}
                            </div>
                            <InfoItem
                              label="زمان شروع"
                              value={rate.startTime ?? '--:--'}
                              icon={<ClockIcon className="size-3.5" />}
                            />
                            <InfoItem
                              label="زمان پایان"
                              value={rate.endTime ?? '--:--'}
                              icon={<ClockIcon className="size-3.5" />}
                            />
                            <InfoItem
                              label="ضریب"
                              value={rate.rate}
                              icon={<TrendingUpIcon className="size-3.5" />}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Weekly Exceptions */}
          {plan.exceptions && plan.exceptions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDaysIcon className="size-4" />
                  استثناهای هفتگی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.exceptions.map((exception, index) => (
                  <Card
                    key={index}
                    className="bg-muted/30 border-muted-foreground/20"
                  >
                    <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="flex items-center gap-2 md:col-span-3">
                        <Badge variant="outline" className="text-xs">
                          استثنا {index + 1}
                        </Badge>
                      </div>
                      <InfoItem
                        label="روز هفته"
                        value={DAY_OF_WEEK[exception.dayOfWeek]}
                        icon={<CalendarDaysIcon className="size-3.5" />}
                      />
                      <InfoItem
                        label="زمان شروع"
                        value={exception.startTime ?? '--:--'}
                        icon={<ClockIcon className="size-3.5" />}
                      />
                      <InfoItem
                        label="زمان پایان"
                        value={exception.endTime ?? '--:--'}
                        icon={<ClockIcon className="size-3.5" />}
                      />
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
