'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useMemo, useTransition } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { updateDepartmentAction } from '@/actions/department'
import {
  UpdateDepartmentModel,
  updateDepartmentSchema,
} from '@/app/tenants/[tenant]/management/departments/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Department } from '@/types/department.interface'

import { DepartmentForm } from './department-form'

type UpdateDepartmentDialogProps = {
  open: boolean
  onOpenChange(state: boolean): void
  department: Department
}

export default function UpdateDepartmentDialog({
  open,
  onOpenChange,
  department,
}: UpdateDepartmentDialogProps) {
  const { id, title, parentDepartment, managers } = department
  const router = useRouter()
  const [formState, action] = useActionState(updateDepartmentAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: UpdateDepartmentModel) => {
    startTransition(() => action(values))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      onOpenChange(false)
      toast.success('بخش با موفقیت ویرایش شد')
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  const defaultValues: z.infer<typeof updateDepartmentSchema> = useMemo(
    () => ({
      id,
      title,
      managers: managers?.map((m) => ({ id: m.id, label: m.name })),
      parentDepartment: parentDepartment && {
        id: parentDepartment?.id,
        label: parentDepartment?.title,
      },
    }),
    //eslint-disable-next-line
    [department],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>ویرایش بخش</DialogTitle>
          <DialogDescription>{`ویرایش بخش ${title}`}</DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={updateDepartmentSchema}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
          defaultValues={defaultValues}
        >
          {(form) => (
            <DepartmentForm
              form={form}
              isPending={isPending}
              loadingText="در حال ویرایش بخش"
              submitText="ویرایش بخش"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
