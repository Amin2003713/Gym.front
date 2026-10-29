'use client'

import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useRouter } from 'next/navigation'
import React, {
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useActionState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  sendActivationCodeAction,
  signinWithTokenAction,
  verifyPhoneNumber,
} from '@/actions/auth'
import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Timer } from '@/components/ui/timer'
import { toast } from '@/lib/toast'

import { ThirdFormSchema } from '../../signup/_types/signup-schema'
import { VerificationValues } from '../../signup/_types/signup.interface'

const getTwoMinutesFromNow = (): Date => {
  const time = new Date()
  time.setSeconds(time.getSeconds() + 120)
  return time
}

type TimerRef = {
  restart: (t: Date) => void
}

export default function VerifyAccountForm() {
  const router = useRouter()
  const paramsRef = useRef<URLSearchParams | null>(null)
  if (!paramsRef.current) {
    paramsRef.current = new URLSearchParams(window.location.search)
  }
  const params = paramsRef.current

  const phoneNumber = params.get('u') ?? ''
  const domain = params.get('d') ?? ''

  const form = useForm<VerificationValues>({
    resolver: zodResolver(ThirdFormSchema),
    defaultValues: {
      domain: domain,
      phoneNumber: phoneNumber,
      code: '',
    },
  })

  const timerRef = useRef<TimerRef>(null)
  const [expired, setExpired] = useState(false)
  const autoSendRef = useRef(false)

  const [isPending, startTransition] = useTransition()
  const [newCodePending, startNewCodeTransition] = useTransition()
  const [signInPending, startSignInTransition] = useTransition()

  const [actionState, action] = useActionState(verifyPhoneNumber, null)
  const [newCodeStateAction, newCodeAction] = useActionState(
    sendActivationCodeAction,
    undefined,
  )

  // Auto-send the activation code once on mount so the user only enters the
  // code — they got here because their login attempt hit the 403
  // "not verified" problem and we redirected them to this page.
  useEffect(() => {
    if (!phoneNumber || autoSendRef.current) return
    autoSendRef.current = true
    startNewCodeTransition(() =>
      newCodeAction({ phoneNumber, domain }),
    )
  }, [phoneNumber, domain, newCodeAction])

  useEffect(() => {
    if (
      newCodeStateAction &&
      newCodeStateAction.isSuccess &&
      !newCodeStateAction.error
    ) {
      timerRef.current?.restart(getTwoMinutesFromNow())
      setExpired(false)
      toast.success('کد تأیید برای شما ارسال شد', {
        description: 'کد تأیید یکبار‌مصرف پیامک شد؛ لطفاً آن را وارد کنید.',
      })
    } else if (
      newCodeStateAction &&
      !newCodeStateAction.isSuccess &&
      newCodeStateAction.error
    ) {
      toast.error('خطا!', {
        description: newCodeStateAction.error.detail!,
      })
    }
  }, [newCodeStateAction, form])

  // After a successful verify the API returns the session token — establish
  // the NextAuth session with it and go to the dashboard.
  useEffect(() => {
    if (actionState && actionState.isSuccess && !actionState.error) {
      const token = actionState.response
      if (!token) {
        toast.error('خطا!', {
          description: 'توکن نشست دریافت نشد؛ لطفاً دوباره تلاش کنید.',
        })
        return
      }
      startSignInTransition(async () => {
        const signedIn = await signinWithTokenAction(token)
        if (signedIn.isSuccess) {
          router.push('/')
          toast.success('خوش آمدید')
        } else {
          toast.error('خطا!', {
            description: signedIn.error?.detail ?? 'خطا در ایجاد نشست کاربری',
          })
        }
      })
    } else if (actionState && !actionState.isSuccess && actionState.error) {
      toast.error('خطا!', {
        description: actionState.error.detail!,
      })
    }
  }, [actionState, router])

  const onSubmit = (data: VerificationValues) => {
    startTransition(() => action(data))
  }

  const resendCode = (): void => {
    form.clearErrors()
    startNewCodeTransition(() =>
      newCodeAction({
        phoneNumber: form.getValues('phoneNumber'),
        domain: form.getValues('domain') || domain,
      }),
    )
  }

  if (!phoneNumber) {
    return (
      <div className="bg-card flex flex-col items-center gap-4 rounded-lg border border-border p-6 text-center shadow-sm">
        <HamOwjBrand className="text-foreground size-10" />
        <p className="text-foreground font-extrabold">لینک نامعتبر است</p>
        <p className="text-muted-foreground text-sm leading-6">
          برای تأیید حساب، ابتدا از صفحه ورود وارد شوید تا کد تأیید ارسال شود.
        </p>
        <a
          href="/signin"
          className="text-primary font-bold underline underline-offset-4"
        >
          بازگشت به صفحه ورود
        </a>
      </div>
    )
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-card text-card-foreground space-y-4 rounded-lg border border-border p-4 shadow-sm shadow-black/5 sm:p-6 dark:shadow-black/20"
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-foreground text-background flex size-12 items-center justify-center rounded-lg">
                <HamOwjBrand className="size-8" />
              </span>
              <div>
                <h3 className="text-foreground font-extrabold">
                  تأیید حساب کاربری
                </h3>
                <p className="text-muted-foreground mt-1 text-xs leading-6">
                  کد ارسال‌شده را وارد کن تا حساب شما فعال شود.
                </p>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-6">
                <FormLabel>کد تأیید</FormLabel>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    autoFocus
                    {...field}
                  >
                    <InputOTPGroup
                      dir="ltr"
                      className="mx-auto [&>*]:p-5 sm:[&>*]:p-6"
                    >
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <Timer
                  expiryTimestamp={getTwoMinutesFromNow()}
                  showDays={false}
                  showHours={false}
                  onExpire={() => setExpired(true)}
                  showTitle
                  size="xs"
                  ref={timerRef}
                />
                <FormDescription>
                  کد تأیید یکبار مصرفی را که برای شما پیامک شده است وارد کنید.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending || signInPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 w-full items-center justify-center rounded-md font-bold disabled:opacity-70"
            >
              {isPending || signInPending
                ? 'لطفاً صبر کنید...'
                : 'تأیید و ورود'}
            </button>
            <button
              type="button"
              onClick={expired ? resendCode : undefined}
              disabled={!expired || newCodePending}
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 disabled:no-underline disabled:opacity-60"
            >
              {newCodePending
                ? 'در حال ارسال کد...'
                : expired
                  ? 'ارسال مجدد کد'
                  : 'کد منقضی نشده است'}
            </button>
          </div>
        </form>
      </Form>
    </>
  )
}
