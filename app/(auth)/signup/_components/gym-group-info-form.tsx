import React from 'react'

import { StepperFormActions } from '@/app/(auth)/signup/_components/stepper-form-actions'
import { SignupValues, StepFormProps } from '@/app/(auth)/signup/_types/signup.interface'
import { CustomFormField } from '@/components/ui/custom-form-field'
import { Form } from '@/components/ui/form'
import { useStepper } from '@/components/ui/stepper'
import { TRAINING_AREAS } from '@/lib/training-areas'
import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { BASE_DOMAIN } from '@/configs/global'

function GymGroupInfoForm({ form }: StepFormProps) {
  const domainValue = form.watch('domain')
  const selectedAreas = form.watch('trainingAreas') ?? []

  const toggleArea = (code: string) => {
    const next = selectedAreas.includes(code)
      ? selectedAreas.filter((area) => area !== code)
      : [...selectedAreas, code]
    form.setValue('trainingAreas', next, { shouldDirty: true, shouldValidate: true })
  }
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
      <form onSubmit={(event) => event.preventDefault()} className="space-y-5 border-0 bg-transparent p-0 text-card-foreground shadow-none pt-10">
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
            label="دامنه اختصاصی"
          />
        </div>
        <CustomFormField<SignupValues> control={form.control} name="name" label="نام گروه ورزشی" placeholder="مثلاً باشگاه آیرون" />

        <div className="space-y-2 rounded-xl border p-3">
          <div>
            <p className="text-sm font-semibold">حوزه‌های تمرینی گروه</p>
            <p className="text-muted-foreground mt-1 text-xs leading-6">
              بر اساس انتخاب شما، کتابخانه حرکات فقط تمرین‌های همان حوزه‌ها را نشان می‌دهد. اگر
              چیزی انتخاب نکنید، همه حرکات در دسترس خواهد بود.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TRAINING_AREAS.map((area) => {
              const selected = selectedAreas.includes(area.code)
              return (
                <button
                  key={area.code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleArea(area.code)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {area.label}
                </button>
              )
            })}
          </div>
        </div>

        <StepperFormActions onNext={onNextStep} />
      </form>
    </Form>
  )
}

export default GymGroupInfoForm
