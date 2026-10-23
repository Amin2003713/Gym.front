'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { addLeaveAction } from '@/actions/leave'
import {
  AddLeaveModel,
  addLeaveSchema,
} from '@/app/tenants/[tenant]/reports/leaves/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import LeaveForm from './leave-form'

type AddLeaveProps = {
  open: boolean
  onOpenChange(open: boolean): void
}

export default function AddLeaveDialog({ open, onOpenChange }: AddLeaveProps) {
  const router = useRouter()
  const [formState, action] = useActionState(addLeaveAction, null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success('مرخصی با موفقیت درج شد')
      router.refresh()
      onOpenChange(false)
    } else if (!!formState?.error && !formState.isSuccess) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState])

  const handleSubmit = (values: AddLeaveModel) => {
    startTransition(() => action(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>ثبت مرخصی</DialogTitle>
          <DialogDescription>افزودن مرخصی برای کارمندان</DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={addLeaveSchema}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <LeaveForm
              form={form}
              isPending={isPending}
              loadingText="در حال ثبت مرخصی"
              submitText="ثبت مرخصی"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
