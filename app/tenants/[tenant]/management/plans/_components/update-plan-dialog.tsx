'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { updatePlanAction } from '@/actions/plan'
import {
  UpdatePlanModel,
  updatePlanSchema,
} from '@/app/tenants/[tenant]/management/plans/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plan } from '@/types/plan.interface'

import { PlanForm } from './plan-form'

type UpdatePlanDialogProps = {
  open: boolean
  onOpenChange(state: boolean): void
  plan: Plan
}

export default function UpdatePlanDialog({
  open,
  onOpenChange,
  plan,
}: UpdatePlanDialogProps) {
  const router = useRouter()
  const [formState, action] = useActionState(updatePlanAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: UpdatePlanModel) => {
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
      toast.success('برنامه با موفقیت ویرایش شد')
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  const defaultValues = {
    departments: plan.departments,
    endDate: plan.endDate,
    endTime: plan.endTime,
    entryDeadlineTime: plan.entryDeadlineTime,
    exceptions: plan.exceptions,
    exitDeadlineTime: plan.exitDeadlineTime,
    holidayOvertimeRate: plan.holidayOvertimeRate,
    id: plan.id,
    maximumOvertimeTime: plan.maximumOvertimeTime,
    name: plan.name,
    normalOvertimeRate: plan.normalOvertimeRate,
    overtimeRates: plan.overtimeRates,
    restTime: plan.restTime,
    startDate: plan.startDate,
    startTime: plan.startTime,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>ویرایش برنامه</DialogTitle>
          <DialogDescription>ویرایش برنامه {`${plan.name}`}</DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={updatePlanSchema}
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <PlanForm
              form={form}
              isPending={isPending}
              loadingText="در حال ویرایش برنامه"
              submitText="ویرایش برنامه"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
