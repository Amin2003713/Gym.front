'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'

import { addUserAction } from '@/actions/user'
import { UserForm } from '@/app/(tenant)/users/_components/user-form'
import { userSchema } from '@/app/(tenant)/users/_model/user.schema'
import { AddUserModel } from '@/app/(tenant)/users/_model/user.types'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GenderEnum } from '@/enums/gender.enum'
import { toast } from '@/lib/toast'

type AddUserDialogProps = {
  open: boolean
  onOpenChange(open: boolean): void
}

const defaultValues: Partial<AddUserModel> = {
  gender: GenderEnum.Male,
}

export default function AddUserDialog({
  open,
  onOpenChange,
}: AddUserDialogProps) {
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [formState, action] = useActionState(addUserAction, null)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success('کاربر با موفقیت افزوده شد')
      router.refresh()
      queryClient.invalidateQueries({ queryKey: ['get-users'] })
      onOpenChange(false)
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error('خطا در افزودن کاربر', {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState, onOpenChange, router])

  const handleSubmit = (data: AddUserModel) => {
    startTransition(() => action(data))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>درج کابر جدید</DialogTitle>
        </DialogHeader>
        <FormWrapper
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          defaultValues={defaultValues}
          schema={userSchema}
          onSubmit={handleSubmit}
        >
          {(form) => (
            <UserForm
              form={form}
              isPending={isPending}
              loadingText="در حال ثبت"
              submitText="درج کاربر"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
