'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useStepper } from '@/components/ui/stepper'

export interface StepperFormActionsProps {
  onNext: () => void
  loading?: boolean
  buttonText?: string
  isExpired?: boolean
}

export function StepperFormActions({ onNext, loading, buttonText, isExpired }: StepperFormActionsProps) {
  const { prevStep, isDisabledStep, isLastStep, isOptionalStep, activeStep } = useStepper()

  return (
    <div className="mt-6 flex w-full items-center justify-between gap-3">
      {activeStep !== 0 ? (
        <Button type="button" disabled={isDisabledStep} onClick={prevStep} variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
          مرحله قبل
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">شروع رایگان گروه</span>
      )}
      <Button type={isOptionalStep || isExpired ? 'button' : 'submit'} onClick={onNext} isLoading={loading} loadingText="در حال ارسال درخواست" className="min-w-32 bg-primary font-bold text-primary-foreground hover:bg-primary/90">
        {buttonText ?? (isLastStep ? 'فعال‌سازی گروه' : isOptionalStep ? 'رد کردن' : 'ادامه')} <ArrowLeft className="mr-1 size-4" />
      </Button>
    </div>
  )
}
