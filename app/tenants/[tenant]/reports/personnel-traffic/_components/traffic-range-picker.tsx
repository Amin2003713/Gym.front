'use client'

import { DownloadIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useTransition } from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

import {
  trafficRangeSchema,
  TrafficRangeType,
} from '@/app/tenants/[tenant]/reports/personnel-traffic/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import { AutoComplete, Option } from '@/components/ui/autoComplete'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { JalaliMonthPicker } from '@/components/ui/month-picker'
import { JalaliYearPicker } from '@/components/ui/year-picker'
import { cn } from '@/lib/utils'
import { Problem } from '@/types/http-errors.interface'
import { PublicUser } from '@/types/user.interface'

import { getTrafficExcel } from '../_api/use-get-stations'

type TrafficRangePickerProps = {
  users: PublicUser[]
  userId: string
  month: string
  year: string
}

export default function TrafficRangePicker({
  users,
  userId,
  month,
  year,
}: TrafficRangePickerProps) {
  const router = useRouter()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isDownloading, startDownloadTransition] = useTransition()

  const handleChangeUser = (
    user: Option | null,
    form: UseFormReturn<FieldValues, unknown, TrafficRangeType>,
  ) => {
    form.setValue('userId', user?.id)
  }

  const handleChangeMonth = (
    month: string,
    form: UseFormReturn<FieldValues, unknown, TrafficRangeType>,
  ) => form.setValue('month', month)

  const handleChangeYear = (
    year: string,
    form: UseFormReturn<FieldValues, unknown, TrafficRangeType>,
  ) => form.setValue('year', year)

  const handleSubmit = useCallback(
    (values: TrafficRangeType) => {
      const next = new URLSearchParams(sp.toString())
      next.set('userId', values.userId)
      next.set('month', values.month)
      next.set('year', values.year)

      startTransition(() =>
        router.replace(`?${next.toString()}`, { scroll: false }),
      )
    },
    [router, sp],
  )

  useEffect(() => {
    const next = new URLSearchParams(sp.toString())
    next.set('userId', userId)
    next.set('month', month)
    next.set('year', year)
    router.replace(`?${next.toString()}`, { scroll: false })
  }, [month, router, sp, userId, year])

  const handleGetTrafficExcel = () => {
    startDownloadTransition(async () => {
      await getTrafficExcel({
        userId,
        month,
        year,
      }).catch((err: Problem) => {
        toast.error(err.title ?? 'خطا!', { description: err.detail })
      })
    })
  }

  return (
    <Card>
      <CardContent>
        <FormWrapper
          schema={trafficRangeSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            userId,
            month,
            year,
          }}
        >
          {(form) => (
            <>
              <div className="grid grid-cols-12 items-center gap-4">
                <div className="col-span-12 flex flex-col gap-1 lg:col-span-4">
                  <AutoComplete
                    options={users.map((u) => ({
                      id: u.id,
                      label: `${u.firstName} ${u.lastName}`,
                    }))}
                    label="پرسنل"
                    placeholder="پرسنل مورد نظر را انتخاب کنید"
                    value={users
                      .map((u) => ({
                        id: u.id,
                        label: `${u.firstName} ${u.lastName}`,
                      }))
                      .find((u) => u.id === form.watch('userId'))}
                    onValueChange={(user) => handleChangeUser(user, form)}
                    ariaInvalid={!!form.formState.errors['userId']?.message}
                  />
                  <span className="text-destructive-foreground">
                    {form.formState.errors['userId'] && (
                      <p className="text-destructive-foreground text-sm">
                        {form.formState.errors['userId']?.message as string}
                      </p>
                    )}
                  </span>
                </div>
                <div className="col-span-6 flex flex-col gap-2 lg:col-span-4">
                  <Label>انتخاب ماه</Label>
                  <JalaliMonthPicker
                    value={form.watch('month')}
                    onChange={(month) => handleChangeMonth(month, form)}
                  />
                  <span className="text-destructive-foreground">
                    {form.formState.errors['month'] && (
                      <p className="text-destructive-foreground text-sm">
                        {form.formState.errors['month']?.message as string}
                      </p>
                    )}
                  </span>
                </div>
                <div className="col-span-6 flex flex-col gap-2 lg:col-span-4">
                  <Label>انتخاب سال</Label>
                  <JalaliYearPicker
                    value={form.watch('year')}
                    onChange={(year) => handleChangeYear(year, form)}
                  />
                  <span className="text-destructive-foreground">
                    {form.formState.errors['year'] && (
                      <p className="text-destructive-foreground text-sm">
                        {form.formState.errors['year']?.message as string}
                      </p>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  isLoading={isPending}
                  disabled={isDownloading}
                  loadingText="گزارش گیری"
                >
                  گزارش گیری
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className={cn(isDownloading && 'animated-border')}
                  onClick={handleGetTrafficExcel}
                  isLoading={isDownloading}
                  disabled={isPending}
                  loadingText="در حال دانلود"
                >
                  خروجی EXCEL
                  <DownloadIcon />
                </Button>
              </div>
            </>
          )}
        </FormWrapper>
      </CardContent>
    </Card>
  )
}
