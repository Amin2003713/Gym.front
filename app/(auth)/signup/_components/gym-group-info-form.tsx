import React from 'react'

import { StepperFormActions } from '@/app/(auth)/signup/_components/signup-form'
import { SignupValues, StepFormProps } from '@/app/(auth)/signup/_types/signup.interface'
import { CustomFormField } from '@/components/ui/custom-form-field'
import { Form } from '@/components/ui/form'
import { useStepper } from '@/components/ui/stepper'
import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { BASE_DOMAIN } from '@/configs/global'

function GymGroupInfoForm({ form }: StepFormProps) {
  const domainValue = form.watch('domain')
  const tenantDomainSuffix = process.env.NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX || BASE_DOMAIN || 'gym.example.com'
  const normalizedSuffix = tenantDomainSuffix.replace(/^https?:\/\//, '').replace(/^\.+|\/+$/g, '')


  const { nextStep } = useStepper()

  const handleCheckDomain = async (event: React.FocusEvent<HTMLInputElement>) => {
    const domain = event.target.value
    if (!domain) return

    const isValid = await form.trigger('domain')
    if (!isValid) return

    try {
      const response = await readData<{ exist: boolean }>(`tenant/check-domain`, {
        params: { domain },
      })
      if (response.exist) {
        form.setError('domain', {
          type: 'manual',
          message: 'این دامنه قبلاً ثبت شده است',
        })
      } else {
        form.clearErrors('domain')
      }
    } catch (err: unknown) {
      const error = err as Problem
      form.setError('domain', {
        type: 'manual',
        message: error.detail,
      })
    }
  }

  const onNextStep = async () => {
    const isValid = await form.trigger(['domain', 'name'])
    if (!isValid) return

    const domain = form.getValues('domain')
    try {
      const response = await readData<{ exist: boolean }>(`tenant/check-domain`, { params: { domain } })
      if (response.exist) {
        form.setError('domain', {
          type: 'manual',
          message: 'این دامنه قبلاً ثبت شده است',
        })
        return
      }

      form.clearErrors()

      nextStep()
    } catch (err: unknown) {
      const error = err as Problem
      form.setError('domain', {
        type: 'manual',
        message: error.detail,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm shadow-black/5 sm:p-6 dark:shadow-black/20">
        <div className="mb-2 border-r-4 border-[#fb9a3c] pr-3"><h3 className="font-black text-foreground">هویت گروه ورزشی</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">نامی انتخاب کن که اعضا و شعبه‌ها با آن شناخته شوند.</p></div>
        <div className="relative">
          <CustomFormField<SignupValues>
            control={form.control}
            name="domain"
            dir="ltr"
            placeholder="iron-gym"
            description={
              <span>
                <span>آدرس آینده شما : </span>
                <span
                  dir="ltr"
                  className="text-primary/80"
                >{`${domainValue.toLocaleLowerCase() || 'iron-gym'}.${normalizedSuffix}`}</span>
              </span>
            }
            onBlur={handleCheckDomain}
            label="آدرس اختصاصی گروه ورزشی"
          />
        </div>
        <CustomFormField<SignupValues> control={form.control} name="name" label="نام گروه ورزشی" />
        <StepperFormActions onNext={onNextStep} />
      </form>
    </Form>
  )
}

export default GymGroupInfoForm
