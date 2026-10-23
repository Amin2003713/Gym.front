'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Dumbbell, ShieldCheck, Trophy } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'

import GymGroupInfoForm from '@/app/(auth)/signup/_components/gym-group-info-form'
import PersonalInfoForm from '@/app/(auth)/signup/_components/personal-info-form'
import VerifyForm from '@/app/(auth)/signup/_components/verify-form'
import { SignupSchema } from '@/app/(auth)/signup/_types/signup-schema'
import { Button } from '@/components/ui/button'
import { Step, Stepper, useStepper } from '@/components/ui/stepper'

import { SignupValues } from '../_types/signup.interface'
import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import { ModeToggle } from '@/components/mode-toggle'

const steps = [
  { label: 'مشخصات باشگاه', description: 'نام گروه و آدرس اختصاصی' },
  { label: 'مدیر گروه', description: 'اطلاعات مالک حساب' },
  { label: 'تأیید شماره', description: 'فعال‌سازی حساب مدیر' },
]

export const SignupForm = () => {
  const form = useForm<SignupValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { domain: '', name: '', firstName: '', lastName: '', nationalCode: '', phoneNumber: '', password: '', confirmPassword: '' },
  })

  return (
    <div className="min-w-0 px-2 py-8 text-foreground sm:px-5 sm:py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-7 px-3 text-right">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HamOwjBrand />
            </div>
            <ModeToggle />
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">پایه‌های باشگاهت را بچین</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">گروه ورزشی‌ات را ثبت کن و مدیریت شعبه‌ها، مربی‌ها و اعضا را یک‌جا شروع کن.</p>
        </div>
        <Stepper variant="line" initialStep={0} steps={steps} className="px-3">
          {steps.map((stepProps, index) => {
            if (index === 0) return <Step key={stepProps.label} {...stepProps}><GymGroupInfoForm form={form} /></Step>
            if (index === 1) return <Step key={stepProps.label} {...stepProps}><PersonalInfoForm form={form} /></Step>
            return <Step key={stepProps.label} {...stepProps}><VerifyForm phoneNumber={form.watch('phoneNumber')} domain={form.getValues('domain')} /></Step>
          })}
        </Stepper>
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border px-3 pt-5 text-center">
          <div className="flex flex-col items-center gap-1.5"><Dumbbell className="size-4 text-[var(--brand-bronze)]" /><span className="text-[11px] font-semibold text-muted-foreground">گروه و شعبه‌ها</span></div>
          <div className="flex flex-col items-center gap-1.5"><ShieldCheck className="size-4 text-[var(--brand-bronze)]" /><span className="text-[11px] font-semibold text-muted-foreground">دسترسی امن</span></div>
          <div className="flex flex-col items-center gap-1.5"><Trophy className="size-4 text-[var(--brand-bronze)]" /><span className="text-[11px] font-semibold text-muted-foreground">مسیر پیشرفت</span></div>
        </div>
      </div>
    </div>
  )
}

export interface StepperFormActionsProps { onNext: () => void; loading?: boolean; buttonText?: string; isExpired?: boolean }

export function StepperFormActions({ onNext, loading, buttonText, isExpired }: StepperFormActionsProps) {
  const { prevStep, isDisabledStep, isLastStep, isOptionalStep, activeStep } = useStepper()
  return (
    <div className="mt-6 flex w-full items-center justify-between gap-3">
      {activeStep !== 0 ? <Button type="button" disabled={isDisabledStep} onClick={prevStep} variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">مرحله قبل</Button> : <span className="text-xs text-muted-foreground">شروع رایگان گروه</span>}
      <Button type={isOptionalStep || isExpired ? 'button' : 'submit'} onClick={onNext} isLoading={loading} loadingText="در حال ارسال درخواست" className="min-w-32 bg-primary font-bold text-primary-foreground hover:bg-primary/90">
        {buttonText ?? (isLastStep ? 'فعال‌سازی گروه' : isOptionalStep ? 'رد کردن' : 'ادامه')} <ArrowLeft className="mr-1 size-4" />
      </Button>
    </div>
  )
}
