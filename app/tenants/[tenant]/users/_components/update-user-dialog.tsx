'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useMemo, useTransition } from 'react'
import { toast } from 'sonner'

import { updateUserAction } from '@/actions/user'
import { UserForm } from '@/app/tenants/[tenant]/users/_components/user-form'
import { updateUserSchema } from '@/app/tenants/[tenant]/users/_model/user.schema'
import { UpdateUserModel } from '@/app/tenants/[tenant]/users/_model/user.types'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PublicUser } from '@/types/user.interface'

type UpdateUserDialogProps = {
  user: PublicUser
  open: boolean
  onOpenChange(open: boolean): void
}

export default function UpdateUserDialog({
  user,
  open,
  onOpenChange,
}: UpdateUserDialogProps) {
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [formState, action] = useActionState(updateUserAction, null)

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success('کاربر با موفقیت ویرایش یافت')
      router.refresh()
      onOpenChange(false)
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error('خطا در ویرایش کاربر', {
        description: formState.error.detail,
      })
    }
  }, [formState, onOpenChange, router])

  const handleSubmit = (data: UpdateUserModel) => {
    startTransition(() => action(data))
  }

  const defaultValues: Partial<UpdateUserModel> = useMemo(
    () => ({
      address: user.address,
      birthDate: user.birthDate,
      department: user.department!,
      firstName: user.firstName,
      gender: user.gender,
      isLeader: user.isLeader,
      lastName: user.lastName,
      nationalCode: user.nationalCode,
      personnelNumber: user.personnelNumber,
      phoneNumber: user.phoneNumber,
      role: user.role,
      userId: user.id,
      imageUrl: user.imageUrl,
    }),
    [user],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>{`ویرایش کاربر (${user.firstName} ${user.lastName})`}</DialogTitle>
        </DialogHeader>
        <FormWrapper
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          defaultValues={defaultValues}
          schema={updateUserSchema}
          onSubmit={handleSubmit}
        >
          {(form) => (
            <UserForm
              form={form}
              isPending={isPending}
              loadingText="در حال ویرایش"
              submitText="ویرایش کاربر"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
