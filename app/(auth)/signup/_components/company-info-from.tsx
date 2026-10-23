import React from 'react'

import { StepperFormActions } from '@/app/(auth)/signup/_components/signup-form'
import { SignupValues, StepFormProps } from '@/app/(auth)/signup/_types/signup.interface'
import { CustomFormField } from '@/components/ui/custom-form-field'
import { Form } from '@/components/ui/form'
import { useStepper } from '@/components/ui/stepper'
import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { BASE_DOMAIN } from '@/configs/global'

function CompanyInfoFrom({ form }: StepFormProps) {
  const domainValue = form.watch('domain')
  const tenantDomainSuffix = process.env.NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX || BASE_DOMAIN || 'yourdomain.com'
  const normalizedSuffix = tenantDomainSuffix.replace(/^https?:\/\//, '').replace(/^\.+|\/+$/g, '')

  const onSubmit = (data: SignupValues) => {
    console.log('Form submitted:', data)
  }

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 p-3 md:p-8">
        <div className="relative">
          <CustomFormField<SignupValues>
            control={form.control}
            name="domain"
            dir="ltr"
            placeholder="my-gym-group"
            description={
              <span>
                <span>آدرس آینده شما : </span>
                <span
                  dir="ltr"
                  className="text-primary/80"
                >{`${domainValue.toLocaleLowerCase() || 'your-group'}.${normalizedSuffix}`}</span>
              </span>
            }
            onBlur={handleCheckDomain}
            label="نشانی اختصاصی گروه"
          />
        </div>
        <CustomFormField<SignupValues> control={form.control} name="name" label="نام گروه باشگاهی" />
        <StepperFormActions onNext={onNextStep} />
      </form>
    </Form>
  )
}

export default CompanyInfoFrom
