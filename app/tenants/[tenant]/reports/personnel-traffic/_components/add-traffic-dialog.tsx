'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { addTrafficAction } from '@/actions/record'
import { TrafficForm } from '@/app/tenants/[tenant]/reports/personnel-traffic/_components/traffic-form'
import {
  AddTrafficModel,
  addTrafficSchema,
} from '@/app/tenants/[tenant]/reports/personnel-traffic/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatJalaliDate } from '@/utils/date'

type AddTrafficProps = {
  open: boolean
  onOpenChange(state: boolean): void
  userId: string | null
  date: string
}

export default function AddTrafficDialog({
  open,
  onOpenChange,
  userId,
  date,
}: AddTrafficProps) {
  const router = useRouter()
  const [formState, action] = useActionState(addTrafficAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: AddTrafficModel) => {
    const cleanedValues = { ...values }
    if (cleanedValues.exitTime === '') delete cleanedValues.exitTime

    startTransition(() => action(cleanedValues))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      onOpenChange(false)
      toast.success('تردد با موفقیت افزوده شد')
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
          <DialogTitle>ثبت تردد</DialogTitle>
          <DialogDescription>
            {`افزودن تردد برای ${formatJalaliDate(date, 'EEE d MMMM yyyy')}`}
          </DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={addTrafficSchema}
          onSubmit={handleSubmit}
          defaultValues={{ userId: userId!, date, enterTime: '08:00' }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <TrafficForm
              form={form}
              isPending={isPending}
              loadingText="در حال ثبت تردد"
              submitText="ثبت تردد"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
