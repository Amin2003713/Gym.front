'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Dumbbell, ShieldCheck, Trophy } from '@/components/icons'
import { useForm } from 'react-hook-form'

import GymGroupInfoForm from '@/app/(auth)/signup/_components/gym-group-info-form'
import PersonalInfoForm from '@/app/(auth)/signup/_components/personal-info-form'
import VerifyForm from '@/app/(auth)/signup/_components/verify-form'
import { SignupSchema } from '@/app/(auth)/signup/_types/signup-schema'
import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import { ModeToggle } from '@/components/mode-toggle'
import { Step, Stepper } from '@/components/ui/stepper'

import type { SignupValues } from '../_types/signup.interface'

const steps = [
  { label: 'مشخصات باشگاه', description: 'نام گروه و آدرس اختصاصی' },
  { label: 'مدیر گروه', description: 'اطلاعات مالک حساب' },
  { label: 'تأیید ایمیل', description: 'فعال‌سازی حساب مدیر' },
]

export const SignupForm = () => {
  const form = useForm<SignupValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      domain: '',
      name: '',
      trainingAreas: [],
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  const stepContent = [
    <GymGroupInfoForm key="gym-info" form={form} />,
    <PersonalInfoForm key="personal-info" form={form} />,
    <VerifyForm
      key="verify"
      email={form.watch('email')}
      phoneNumber={form.watch('phoneNumber')}
      domain={form.getValues('domain')}
    />,
  ]

  return (
    <main
      dir="rtl"
      className="text-foreground min-w-0 px-2 py-8 sm:px-5 sm:py-10"
    >
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-7 px-3 text-right">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex items-center gap-3">
                <HamOwjBrand />
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                گروه ورزشی خود را بسازید
              </h1>
            </div>

            <ModeToggle />
          </div>

          <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-7">
            در چند مرحله کوتاه، باشگاهتان را ثبت کنید و مسیر مدیریت اعضا و
            مربیان را شروع کنید.
          </p>
        </header>

        <section className="border-border bg-card rounded-3xl border p-4 shadow-xl shadow-black/[0.04] sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs font-semibold">
                مراحل ثبت‌نام
              </p>
              <p className="mt-1 text-sm font-bold">اطلاعات گروه و مدیر</p>
            </div>

            <span className="bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-bold">
              ۳ مرحله
            </span>
          </div>

          <Stepper
            variant="line"
            initialStep={0}
            steps={steps}
            className="px-0"
          >
            {stepContent.map((content, index) => (
              <Step key={steps[index].label} {...steps[index]}>
                {content}
              </Step>
            ))}
          </Stepper>
        </section>

        <footer className="text-muted-foreground mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck
              className="size-4 text-[var(--brand-bronze)]"
              aria-hidden="true"
            />
            ثبت‌نام امن
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Trophy
              className="size-4 text-[var(--brand-bronze)]"
              aria-hidden="true"
            />
            مسیر پیشرفت
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Dumbbell
              className="size-4 text-[var(--brand-bronze)]"
              aria-hidden="true"
            />
            مدیریت یکپارچه
          </span>
        </footer>
      </div>
    </main>
  )
}
