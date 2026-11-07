'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useTransition } from 'react'
import * as React from 'react'

import { sendActivationCodeAction, signinAction } from '@/actions/auth'
import { PasskeySigninButton } from '@/app/(auth)/signin/_components/passkey-signin-button'
import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import { FormWrapper } from '@/components/forms/form-wrapper'
import { ArrowLeft } from '@/components/icons'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { CustomFormField } from '@/components/ui/custom-form-field'
import { BASE_DOMAIN } from '@/configs/global'
import { toast } from '@/lib/toast'

import { signinSchema } from '../_types/signin-schema'
import { SigninUserModel } from '../_types/signin-user-model.type'

export function SigninForm() {
  const router = useRouter()

  const [loginState, action] = useActionState(signinAction, undefined)
  const [isPending, startTransition] = useTransition()
  const lastAttemptedUserName = useRef('')

  // Warm the dashboard route while the visitor types, so the post-login transition does not
  // have to wait for the first chunks of `/` as well as the session cookie.
  useEffect(() => {
    router.prefetch('/')
  }, [router])

  useEffect(() => {
    if (loginState && !loginState.isSuccess && loginState.error) {
      // 403 = account not verified by admins yet → activate it with an emailed code.
      if (
        loginState.error.status === 403 ||
        loginState.error.title === 'FORBIDDEN'
      ) {
        const userName = lastAttemptedUserName.current

        toast.error('حساب شما تأیید نشده است!', {
          description: 'برای فعال‌سازی، کد تأیید به ایمیل حساب شما ارسال می‌شود.',
        })

        // The activation endpoint is tenant-scoped; on a gym subdomain the tenant must be sent,
        // otherwise the code is generated against the wrong gym and never verifies.
        const base = BASE_DOMAIN?.replace(/^https?:\/\//, '').split(':')[0]
        const host = window.location.hostname
        const tenantDomain =
          base && host.endsWith(`.${base}`)
            ? host.slice(0, -(base.length + 1))
            : ''

        startTransition(async () => {
          await sendActivationCodeAction(undefined, {
            phoneNumber: userName,
            domain: tenantDomain,
          })

          router.push(`/verify-account?u=${encodeURIComponent(userName)}`)
        })

        return
      }

      toast.error('خطا!', {
        description: loginState.error.detail || 'خطایی رخ داده است.',
      })
    } else if (loginState?.isSuccess) {
      toast.success('خوش آمدید')
      router.push('/')
    }
  }, [loginState, router])

  const onSubmit = (data: SigninUserModel) => {
    lastAttemptedUserName.current = data.userName || ''
    startTransition(() => action(data))
  }


  return (
    <FormWrapper
      schema={signinSchema}
      onSubmit={onSubmit}
      className="p-5 sm:p-6 md:p-8"
      defaultValues={{
        userName: '',
        password: '',
      }}
    >
      {(form) => (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 text-start">
              <span className="bg-foreground text-background flex size-11 shrink-0 items-center justify-center rounded-lg sm:size-12">
                <HamOwjBrand className="size-7 sm:size-8" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="text-xl leading-8 font-extrabold sm:text-[2rem] sm:leading-11">
                  ورود به هم‌اوج
                </h1>

                <p className="text-muted-foreground text-sm text-balance sm:text-base">
                  به پنل مدیریت گروه ورزشی وارد شوید
                </p>
              </div>
            </div>

            <ModeToggle />
          </div>

          <div className="grid gap-2">
            <CustomFormField
              control={form.control}
              name="userName"
              label="شماره همراه (نام کاربری)"
              type="tel"
              inputMode="tel"
              autoComplete="username"
              dir="ltr"
              className="[&_input]:text-start"
            />
          </div>
          <div className="grid gap-2">
            <CustomFormField
              control={form.control}
              name="password"
              label="رمزعبور"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <div className="text-center text-xs sm:text-sm md:text-start">
            رمز عبور را فراموش کرده‌اید؟
            <a href="/forget-password" className="underline underline-offset-4">
              بازیابی رمز عبور
            </a>
          </div>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full font-bold"
            isLoading={isPending}
          >
            ورود به پنل <ArrowLeft className="ms-2 size-4" />
          </Button>

          <div className="text-muted-foreground relative py-1 text-center text-xs">
            <span className="bg-background px-3">یا</span>
          </div>

          <PasskeySigninButton />
          <div className="border-border flex flex-col gap-3 border-t pt-5 text-center text-sm">
            <p className="text-muted-foreground">
              هنوز گروه ورزشی ثبت نکرده‌اید؟
            </p>
            <a
              href="/signup"
              className="text-foreground font-bold underline underline-offset-4"
            >
              ثبت گروه ورزشی جدید
            </a>
          </div>
        </div>
      )}
    </FormWrapper>
  )
}
