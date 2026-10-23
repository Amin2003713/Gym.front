'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { updateTrafficAction } from '@/actions/record'
import {
  UpdateTrafficModel,
  updateTrafficSchema,
} from '@/app/tenants/[tenant]/reports/personnel-traffic/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TrafficRecordInterface } from '@/types/traffic.interface'
import { formatJalaliDate } from '@/utils/date'

import { TrafficForm } from './traffic-form'

type UpdateTrafficDialogProps = {
  open: boolean
  onOpenChange(): void
  record: TrafficRecordInterface
  userId: string | null
  date: string
}

export default function UpdateTrafficDialog({
  open,
  onOpenChange,
  record,
  userId,
  date,
}: UpdateTrafficDialogProps) {
  const router = useRouter()
  const [formState, action] = useActionState(updateTrafficAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: UpdateTrafficModel) => {
    const cleanedValues = { ...values }
    if (cleanedValues.exitTime === '') delete cleanedValues.exitTime

    startTransition(() => action(cleanedValues))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      onOpenChange()
      toast.success('تردد با موفقیت ویرایش شد')
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>ویرایش تردد</DialogTitle>
          <DialogDescription>
            {`ویرایش تردد برای ${formatJalaliDate(date, 'EEE d MMMM yyyy')}`}
          </DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={updateTrafficSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            id: record.id,
            userId: userId!,
            date,
            enterTime: record.enterTime,
            exitTime: record.exitTime !== '--:--' ? record.exitTime : undefined,
            enterStationId: record.enterStation.id,
            exitStationId: record.exitStation?.id,
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <TrafficForm
              form={form}
              isPending={isPending}
              loadingText="در حال ویرایش تردد"
              submitText="ویرایش تردد"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
