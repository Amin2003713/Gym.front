import { zodResolver } from '@hookform/resolvers/zod'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useRouter } from 'next/navigation'
import React, {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useForm } from 'react-hook-form'


import { sendActivationCodeAction, verifyPhoneNumber } from '@/actions/auth'
import { ThirdFormSchema } from '@/app/(auth)/signup/_types/signup-schema'
import { VerificationValues } from '@/app/(auth)/signup/_types/signup.interface'
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
import { BASE_DOMAIN } from '@/configs/global'
import { toast } from '@/lib/toast'

import { StepperFormActions } from './stepper-form-actions'

const getTwoMinutesFromNow = (): Date => {
  const time = new Date()
  time.setSeconds(time.getSeconds() + 120)
  return time
}

type VerifyFormType = {
  domain: string
  email?: string
  phoneNumber?: string
}

// no need for whole form
function VerifyForm({ domain, email, phoneNumber }: VerifyFormType) {
  const validationForm = useForm<VerificationValues>({
    resolver: zodResolver(ThirdFormSchema),
    defaultValues: {
      domain: domain,
      email: email ?? '',
      phoneNumber: phoneNumber ?? '',
      code: '',
    },
  })

  const router = useRouter()
  const timerRef = useRef<TimerRef>(null)

  const [expired, setExpired] = useState(false)
  const autoSendRef = useRef(false)

  const [isPending, startTransition] = useTransition()
  const [newCodePending, startNewCodeTransition] = useTransition()

  const [actionState, action] = useActionState(verifyPhoneNumber, null)
  const [newCodeStateAction, newCodeAction] = useActionState(
    sendActivationCodeAction,
    undefined,
  )

  function onSubmit(_data: VerificationValues) {
    startTransition(() => action(validationForm.getValues()))
  }

  const resendCode = async (): Promise<void> => {
    validationForm.clearErrors()

    startNewCodeTransition(() =>
      newCodeAction({
        email: validationForm.getValues('email') || email,
        phoneNumber: validationForm.getValues('phoneNumber') || phoneNumber,
        domain: validationForm.getValues('domain') || domain,
      }),
    )
  }

  // The first code is emailed as soon as this step opens; the user should only need their inbox.
  useEffect(() => {
    if (autoSendRef.current || (!email && !phoneNumber)) return
    autoSendRef.current = true
    startNewCodeTransition(() =>
      newCodeAction({ email, phoneNumber, domain }),
    )
  }, [domain, email, newCodeAction, phoneNumber])

  useEffect(() => {
    if (
      newCodeStateAction &&
      newCodeStateAction.isSuccess &&
      !newCodeStateAction.error
    ) {
      timerRef.current?.restart(getTwoMinutesFromNow())
      setExpired(false)
      toast.success(
        `کد تأیید دوباره به ${validationForm.getValues('email') || email || 'ایمیل حساب'} ارسال شد`,
      )
    } else if (
      newCodeStateAction &&
      !newCodeStateAction.isSuccess &&
      newCodeStateAction.error
    ) {
      toast.error('خطا ! ', {
        description: newCodeStateAction.error.detail!,
      })
    }
  }, [newCodeStateAction])

  useEffect(() => {
    // Same suffix the first step previewed, so the new gym opens on the host it was created for.
    const suffix = (
      process.env.NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX ||
      BASE_DOMAIN ||
      ''
    )
      .replace(/^https?:\/\//, '')
      .replace(/^\.+|\.+$/g, '')

    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
    const domain = validationForm.getValues('domain')
    const newUrl = suffix ? `${protocol}//${domain}.${suffix}` : '/signin'

    if (actionState && actionState.isSuccess && !actionState.error) {
      router.push(newUrl)
    } else if (actionState && !actionState.isSuccess && actionState.error) {
      toast.error('خطا ! ', {
        description: actionState.error.detail!,
      })
    }
  }, [actionState, router, validationForm])

  return (
    <>
      <Form {...validationForm}>
        <form
          onSubmit={validationForm.handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm shadow-black/5 sm:p-6 dark:shadow-black/20"
        >
          <div className="mb-2 border-s-4 border-primary ps-3"><h3 className="font-extrabold text-foreground">فعال‌سازی حساب</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">کد ارسال‌شده را وارد کن تا گروه ورزشی فعال شود.</p></div>
          <FormField
            control={validationForm.control}
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
                  کد یک‌بارمصرفی که به ایمیل حساب شما ارسال شد را وارد کنید.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <StepperFormActions
            isExpired={expired}
            onNext={
              expired ? resendCode : validationForm.handleSubmit(onSubmit)
            }
            loading={isPending || newCodePending}
            buttonText={expired ? 'ارسال مجدد کد' : undefined}
          />
        </form>
      </Form>
    </>
  )
}

export default VerifyForm
