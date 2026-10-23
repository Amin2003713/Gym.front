import React, { useActionState, useEffect, useRef, useTransition } from 'react'
import { toast } from 'sonner'

import { signupCompanyAction } from '@/actions/auth'
import { StepperFormActions } from '@/app/(auth)/signup/_components/stepper-form-actions'
import {
  SignupValues,
  StepFormProps,
} from '@/app/(auth)/signup/_types/signup.interface'
import { CustomFormField, NumberField } from '@/components/ui/custom-form-field'
import { Form } from '@/components/ui/form'
import { useStepper } from '@/components/ui/stepper'

function PersonalInfoForm({ form }: StepFormProps) {
  const { nextStep } = useStepper()

  const [isPending, startTransition] = useTransition()

  const [signupState, action] = useActionState(signupCompanyAction, null)

  // Process each action result once. Depending on form.getValues here can rerun
  // the effect when the form methods identity changes and repeatedly advance steps.
  const processedSignupState = useRef<unknown>(null)

  useEffect(() => {
    if (!signupState || processedSignupState.current === signupState) return

    processedSignupState.current = signupState

    if (!signupState.isSuccess && signupState.error) {
      toast.error(signupState.error.detail, {
        duration: 5000,
        position: 'top-right',
      })
    } else if (signupState.isSuccess) {
      toast.success('کد تایید به شماره همراه شما ارسال شد', {
        duration: 5000,
        position: 'top-right',
      })
      nextStep()
    }
  }, [signupState, nextStep])

  const onNextStep = async () => {
    const isValid = await form.trigger([
      'email',
      'firstName',
      'lastName',
      'password',
      'confirmPassword',
    ])
    if (isValid) {
      startTransition(() => action(form.getValues()))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} className="space-y-4 border-0 bg-transparent p-0 text-card-foreground shadow-none">
        <div className="mb-3 grid grid-cols-2 gap-3 pt-10">
          <div className="col-span-2">
            <CustomFormField<SignupValues>
              control={form.control}
              name="email"
              type="email"
              dir="ltr"
              label="ایمیل مدیر گروه"
              placeholder="you@example.com"
            />
          </div>
          <div className="col-span-2">
            <CustomFormField<SignupValues>
              control={form.control}
              name="firstName"
              label="نام مدیر"
            />
          </div>
          <div className="col-span-2">
            <CustomFormField<SignupValues>
              control={form.control}
              name="lastName"
              label="نام خانوادگی مدیر"
            />
          </div>
          <div className="col-span-2">
            <NumberField<SignupValues>
              form={form}
              name="phoneNumber"
              type="number"
              label="شماره همراه مدیر"
              maxLength={11}
            />
          </div>
          <div className="col-span-2 lg:col-span-1">
            <CustomFormField<SignupValues>
              control={form.control}
              name="password"
              label="رمز عبور"
              type="password"
            />
          </div>
          <div className="col-span-2 lg:col-span-1">
            <CustomFormField<SignupValues>
              control={form.control}
              name="confirmPassword"
              label="تکرار رمز عبور"
              type="password"
            />
          </div>
        </div>
        <StepperFormActions onNext={onNextStep} loading={isPending} />
      </form>
    </Form>
  )
}

export default PersonalInfoForm
