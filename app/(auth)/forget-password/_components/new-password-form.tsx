import { useRouter } from 'next/navigation'
import React, {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from 'react'
import { toast } from 'sonner'

import { newPasswordAction } from '@/actions/auth'
import CodeVerificationInput from '@/components/common/code-verification-input'
import { FormWrapper } from '@/components/forms/form-wrapper'
import { Button } from '@/components/ui/button'
import { CustomFormField } from '@/components/ui/custom-form-field'

import { NewPasswordModel } from './../_types/new-password-model'
import { newPasswordSchema } from './../_types/new-password-schema'

type NewPasswordFormProps = {
  onModifyPhoneNumber: React.Dispatch<React.SetStateAction<string | undefined>>
  phoneNumber: string
}

function NewPasswordForm({
  onModifyPhoneNumber,
  phoneNumber,
}: NewPasswordFormProps) {
  const router = useRouter()
  const [actionState, action] = useActionState(newPasswordAction, undefined)
  const [expired, setExpired] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()
  const onSubmit = (data: NewPasswordModel) => {
    if (expired) return
    startTransition(() => action(data))
  }

  useEffect(() => {
    if (actionState && !actionState.isSuccess && actionState.error) {
      toast.error('خطا ! ', {
        description: actionState.error.detail!,
      })
    } else if (actionState && actionState.isSuccess) {
      router.push('/signin')
      toast.success('رمز شما باموفقیت تغییر یافت !')
    }
  }, [actionState])

  function handleEditPhoneNumber() {
    onModifyPhoneNumber(undefined)
  }

  return (
    <FormWrapper
      defaultValues={{
        userName: phoneNumber!,
        newPassword: '',
        confirmPassword: '',
        code: '',
      }}
      schema={newPasswordSchema}
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          <CodeVerificationInput
            phoneNumber={phoneNumber!}
            name="code"
            formControl={form.control}
            expired={expired}
            onExpired={setExpired}
            isSubmitting={expired || isPending}
          />

          <div className="grid gap-3">
            <CustomFormField
              control={form.control}
              name="newPassword"
              label="رمز جدید"
              type={'password'}
            />

            <CustomFormField
              control={form.control}
              name="confirmPassword"
              label="تایید رمز جدید"
              type={'password'}
            />

            <div className="my-4 grid gap-3">
              <Button
                onClick={handleEditPhoneNumber}
                type="button"
                variant={'outline'}
                className="w-full"
              >
                ویرایش شماره موبایل
              </Button>

              <Button
                disabled={expired}
                isLoading={isPending}
                type="submit"
                className="w-full"
              >
                تغیر رمز
              </Button>
            </div>
          </div>
        </>
      )}
    </FormWrapper>
  )
}

export default NewPasswordForm
