'use client'

import { ArrowLeft } from 'lucide-react'
import { HamOwjMark } from '@/components/branding/hamowj-mark'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { signinAction } from '@/actions/auth'
import { FormWrapper } from '@/components/forms/form-wrapper'
import { Button } from '@/components/ui/button'
import { CustomFormField } from '@/components/ui/custom-form-field'
import { BASE_DOMAIN } from '@/configs/global'

import { signinSchema } from '../_types/signin-schema'
import { SigninUserModel } from '../_types/signin-user-model.type'

export function SigninForm() {
  const router = useRouter()

  const [loginState, action] = useActionState(signinAction, undefined)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (loginState && !loginState.isSuccess && loginState.error) {
      toast.error('خطا ! ', {
        description: loginState.error.detail!,
      })
    } else if (loginState && loginState.isSuccess) {
      router.push('/')
      toast.success('خوش آمدید')
    }
  }, [loginState, router, toast])

  const onSubmit = (data: SigninUserModel) => {
    startTransition(() => action(data))
  }

  return (
    <FormWrapper
      schema={signinSchema}
      onSubmit={onSubmit}
      className="p-6 md:p-8"
      defaultValues={{
        userName: '',
        password: '',
      }}
    >
      {(form) => (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#1b1a1b] p-2.5"><HamOwjMark className="h-full w-full" /></span>
            <h1 className="text-xl font-black sm:text-2xl">ورود به هم‌اوج</h1>
            <p className="text-muted-foreground text-sm text-balance sm:text-base">
              به پنل مدیریت گروه ورزشی وارد شوید
            </p>
          </div>
          <div className="grid gap-2">
            <CustomFormField
              control={form.control}
              name="userName"
              label="نام کاربری"
            />
          </div>
          <div className="grid gap-2">
            <CustomFormField
              control={form.control}
              name="password"
              label="رمزعبور"
            />
          </div>
          <div className="text-center text-xs sm:text-sm md:text-right">
            رمز عبور را فراموش کرده‌اید؟
            <a href="/forget-password" className="underline underline-offset-4">
              بازیابی رمز عبور
            </a>
          </div>
          <Button type="submit" className="w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90" isLoading={isPending}>
            ورود به پنل <ArrowLeft className="mr-2 size-4" />
          </Button>
          <div className="flex flex-col gap-3 border-t border-border pt-5 text-center text-sm">
            <p className="text-muted-foreground">هنوز گروه ورزشی ثبت نکرده‌اید؟</p>
            <a href="/signup" className="font-bold text-[var(--brand-bronze)] underline underline-offset-4">ثبت گروه ورزشی جدید</a>
          </div>
        </div>
      )}
    </FormWrapper>
  )
}
