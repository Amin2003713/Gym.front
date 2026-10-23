'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { addPlanAction } from '@/actions/plan'
import {
  AddPlanModel,
  addPlanSchema,
} from '@/app/tenants/[tenant]/management/plans/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { PlanForm } from './plan-form'

type AddPlanProps = {
  open: boolean
  onOpenChange(state: boolean): void
}

export default function AddPlanDialog({ open, onOpenChange }: AddPlanProps) {
  const router = useRouter()
  const [formState, action] = useActionState(addPlanAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: AddPlanModel) => {
    const payload = { ...values }

    if (payload.overtimeRates?.length === 0) {
      payload.overtimeRates = null
    }
    if (payload.exceptions?.length === 0) {
      payload.exceptions = null
    }
    if (!payload.restTime || payload.restTime.length === 0)
      payload.restTime = null
    if (!payload.entryDeadlineTime || payload.entryDeadlineTime.length === 0)
      payload.entryDeadlineTime = null
    if (
      !payload.maximumOvertimeTime ||
      payload.maximumOvertimeTime.length === 0
    )
      payload.maximumOvertimeTime = null
    if (!payload.exitDeadlineTime || payload.exitDeadlineTime.length === 0)
      payload.exitDeadlineTime = null
    startTransition(() => action(payload))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      onOpenChange(false)
      toast.success('برنامه با موفقیت افزوده شد')
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
          <DialogTitle>ثبت برنامه</DialogTitle>
          <DialogDescription>افزودن برنامه برای ترددها</DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={addPlanSchema}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <PlanForm
              form={form}
              isPending={isPending}
              loadingText="در حال ثبت برنامه"
              submitText="ثبت برنامه"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
