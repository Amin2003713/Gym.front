'use client'
import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useMemo, useTransition } from 'react'
import { toast } from 'sonner'

import { updateLeaveAction } from '@/actions/leave'
import LeaveForm from '@/app/tenants/[tenant]/reports/leaves/_components/leave-form'
import {
  UpdateLeaveModel,
  updateLeaveSchema,
} from '@/app/tenants/[tenant]/reports/leaves/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Leave } from '@/types/leave.interface'

type UpdateLeaveProps = {
  open: boolean
  onOpenChange(open: boolean): void
  leave: Leave
}

export default function UpdateLeaveDialog({
  open,
  onOpenChange,
  leave,
}: UpdateLeaveProps) {
  const router = useRouter()
  const [formState, action] = useActionState(updateLeaveAction, null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success('مرخصی با موفقیت ویرایش شد')
      router.refresh()
      onOpenChange(false)
    } else if (!!formState?.error && !formState.isSuccess) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState])

  const handleSubmit = (values: UpdateLeaveModel) => {
    startTransition(() => action(values))
  }

  const defaultValues: UpdateLeaveModel = useMemo(
    () => ({
      id: leave.id,
      userId: leave.user.id,
      type: leave.type,
      status: leave.status,
      startDate: leave.startDate,
      endDate: leave.endDate,
      description: leave.description,
      mediaUrls: leave.media,
    }),
    [leave],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>ویرایش مرخصی</DialogTitle>
          <DialogDescription>ویرایش مرخصی کارمندان</DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={updateLeaveSchema}
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <LeaveForm
              form={form}
              isPending={isPending}
              loadingText="در حال ویرایش مرخصی"
              submitText="ویرایش مرخصی"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
