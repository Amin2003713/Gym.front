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
import { toast } from 'sonner'

import { sendActivationCodeAction, verifyPhoneNumber } from '@/actions/auth'
import { StepperFormActions } from '@/app/(auth)/signup/_components/signup-form'
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

const getTwoMinutesFromNow = (): Date => {
  const time = new Date()
  time.setSeconds(time.getSeconds() + 120)
  return time
}

type VerifyFormType = {
  domain: string
  phoneNumber: string
}

// no need for whole form
function VerifyForm({ domain, phoneNumber }: VerifyFormType) {
  const validationForm = useForm<VerificationValues>({
    resolver: zodResolver(ThirdFormSchema),
    defaultValues: {
      domain: domain,
      phoneNumber: phoneNumber,
      code: '',
    },
  })

  const router = useRouter()
  const timerRef = useRef<TimerRef>(null)

  const [expired, setExpired] = useState(false)

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
      newCodeAction({ phoneNumber: validationForm.getValues().phoneNumber }),
    )
  }

  useEffect(() => {
    if (
      newCodeStateAction &&
      newCodeStateAction.isSuccess &&
      !newCodeStateAction.error
    ) {
      timerRef.current?.restart(getTwoMinutesFromNow())
      setExpired(false)
      toast.success(
        `کد تأیید مجددا برای شماره ${validationForm.getValues().phoneNumber} ارسال شد`,
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
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
    const newUrl = `${protocol}//${validationForm.getValues('domain')}.${BASE_DOMAIN}`
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
          className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm shadow-black/5 sm:p-6 dark:shadow-black/20"
        >
          <div className="mb-2 border-r-4 border-[#fb9a3c] pr-3"><h3 className="font-black text-foreground">فعال‌سازی حساب</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">کد ارسال‌شده را وارد کن تا گروه ورزشی فعال شود.</p></div>
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
                  کد تأیید یکبار مصرفی را که به شماره همراه شما ارسال شده را
                  وارد کنید.
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
