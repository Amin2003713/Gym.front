import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { signupCompanyAction } from '@/actions/auth'
import { StepperFormActions } from '@/app/(auth)/signup/_components/signup-form'
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

  useEffect(() => {
    if (signupState && !signupState.isSuccess && signupState.error) {
      toast.error(signupState.error.detail, {
        duration: 5000,
        position: 'top-right',
      })
    } else if (signupState && signupState.isSuccess) {
      toast.success('کد تایید به شماره همراه شما ارسال شد', {
        duration: 5000,
        position: 'top-right',
      })
      nextStep()
    }
  }, [signupState, form.getValues])

  const onNextStep = async () => {
    const isValid = await form.trigger([
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
      <form onSubmit={(event) => event.preventDefault()} className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm shadow-black/5 sm:p-6 dark:shadow-black/20">
        <div className="mb-2 border-r-4 border-[#fb9a3c] pr-3"><h3 className="font-black text-foreground">حساب مدیر گروه</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">این حساب برای مدیریت گروه و دعوت مربی‌ها و اعضا استفاده می‌شود.</p></div>
        <div className="mb-3 grid grid-cols-2 gap-3">
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
          <CustomFormField
            control={form.control}
            name="nationalCode"
            type="tel"
            label="کد ملی مدیر"
            className="col-span-2"
          />
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
