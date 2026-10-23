'use client'

import React, { useActionState, useEffect, useRef, useTransition } from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

import { sendActivationCodeAction } from '@/actions/auth'
import { ForgetPasswordModel } from '@/app/(auth)/forget-password/_types/forget-password-model'
import { forgetPassword } from '@/app/(auth)/forget-password/_types/forget-password-schema'
import { FormWrapper } from '@/components/forms/form-wrapper'
import { Button } from '@/components/ui/button'
import { CustomFormField } from '@/components/ui/custom-form-field'

type ForgetPasswordType = {
  onSuccess: React.Dispatch<React.SetStateAction<string | undefined>>
}

function RequestCodeForm({ onSuccess }: ForgetPasswordType) {
  const [actionState, action] = useActionState(
    sendActivationCodeAction,
    undefined,
  )
  const [isPending, startTransition] = useTransition()
  const fomRef =
    useRef<UseFormReturn<FieldValues, unknown, ForgetPasswordModel>>(null)

  const onSubmitForm = (data: ForgetPasswordModel) => {
    startTransition(() => {
      action({ phoneNumber: data.userName })
    })
  }

  useEffect(() => {
    if (actionState && !actionState.isSuccess && actionState.error) {
      toast.error('خطا ! ', {
        description: actionState.error.detail!,
      })
    } else if (actionState && actionState.isSuccess) {
      toast.success('کد تایید برای موبایل شما ارسال شد !!')
      onSuccess(fomRef.current?.watch('userName'))
      console.log(actionState)
    }
  }, [actionState])

  return (
    <FormWrapper
      schema={forgetPassword}
      onSubmit={onSubmitForm}
      defaultValues={{ userName: '' }}
    >
      {(form) => {
        fomRef.current = form

        return (
          <div className="grid gap-2">
            <CustomFormField
              control={form.control}
              name="userName"
              label="نام کاربری"
            />

            <Button isLoading={isPending} type="submit" className="w-full">
              ارسال کد
            </Button>
          </div>
        )
      }}
    </FormWrapper>
  )
}

export default RequestCodeForm
