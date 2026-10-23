'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { addDepartmentAction } from '@/actions/department'
import {
  AddDepartmentModel,
  addDepartmentSchema,
} from '@/app/tenants/[tenant]/management/departments/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { DepartmentForm } from './department-form'

type AddDepartmentProps = {
  open: boolean
  onOpenChange(state: boolean): void
}

export default function AddDepartmentDialog({
  open,
  onOpenChange,
}: AddDepartmentProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [formState, action] = useActionState(addDepartmentAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: AddDepartmentModel) => {
    startTransition(() => action(values))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      onOpenChange(false)
      toast.success('بخش با موفقیت افزوده شد')
      queryClient.invalidateQueries({ queryKey: ['get-departments'] })
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
          <DialogTitle>ثبت بخش</DialogTitle>
          <DialogDescription>افزودن بخش ثبت تردد</DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={addDepartmentSchema}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <DepartmentForm
              form={form}
              isPending={isPending}
              loadingText="در حال ثبت بخش"
              submitText="ثبت بخش"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
