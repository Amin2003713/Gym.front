'use client'

import { PenIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { updateUserSimSerialAction } from '@/actions/user'
import { updateUserSimSerialSchema } from '@/app/tenants/[tenant]/users/_model/user.schema'
import { UpdateUserSimSerialModel } from '@/app/tenants/[tenant]/users/_model/user.types'
import { FormWrapper } from '@/components/forms/form-wrapper'
import { Button } from '@/components/ui/button'
import { CustomFormField } from '@/components/ui/custom-form-field'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type UpdateUserSimSerialDialogProps = {
  userName: string
  userId: string
  prevSimSerial: string | null
  open: boolean
  onOpenChange(open: boolean): void
}

export const UpdateUserSimSerialDialog = ({
  userName,
  userId,
  prevSimSerial,
  open,
  onOpenChange,
}: UpdateUserSimSerialDialogProps) => {
  const router = useRouter()

  const [isePending, startTransition] = useTransition()
  const [formState, action] = useActionState(updateUserSimSerialAction, null)

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success('شناسه با موفقیت ویرایش یافت')
      router.refresh()
      onOpenChange(false)
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error('خطا در ویرایش شناسه', {
        description: formState.error.detail,
      })
    }
  }, [formState, onOpenChange, router])

  const handleSubmit = (values: UpdateUserSimSerialModel) => {
    startTransition(() => action(values))
  }

  const defaultValues: Partial<UpdateUserSimSerialModel> = {
    userId,
    simSerial: prevSimSerial ?? undefined,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>{`ویرایش شناسه (${userName})`}</DialogTitle>
        </DialogHeader>
        <FormWrapper
          schema={updateUserSimSerialSchema}
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <>
              <div className="grid flex-1 gap-4 overflow-y-auto px-2 py-1">
                <div>
                  <CustomFormField
                    control={form.control}
                    name="simSerial"
                    label="شناسه ( sim serial )"
                  />
                </div>
              </div>
              <DialogFooter className="flex shrink-0 flex-row">
                <Button isLoading={isePending} className="flex-1">
                  ویرایش شناسه
                  <PenIcon />
                </Button>
                <DialogClose asChild>
                  <Button variant="destructive">انصراف</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
