'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo, useTransition } from 'react'

import { updateUserAction } from '@/actions/user'
import { UserForm } from '@/app/(tenant)/(console)/users/_components/user-form'
import { updateUserSchema } from '@/app/(tenant)/(console)/users/_model/user.schema'
import { UpdateUserModel } from '@/app/(tenant)/(console)/users/_model/user.types'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PublicUser } from '@/types/user.interface'
import { toast } from '@/lib/toast'

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
      email: '',
      firstName: user.firstName,
      gender: user.gender,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role[0],
      id: user.id,
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
