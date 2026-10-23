'use client'

import { REGEXP_ONLY_DIGITS } from 'input-otp'
import React, { useActionState, useEffect, useRef, useTransition } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'
import { toast } from 'sonner'

import { sendActivationCodeAction } from '@/actions/auth'

import { Button } from '../ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp'
import { Timer } from '../ui/timer'

const getTwoMinutesFromNow = (): Date => {
  const time = new Date()
  time.setSeconds(time.getSeconds() + 120)
  return time
}

interface CodeVerificationInputProps<T extends FieldValues> {
  phoneNumber: string
  domain: string
  formControl: Control<T>
  isSubmitting?: boolean
  name: Path<T>
  onExpired: React.Dispatch<React.SetStateAction<boolean>>
  expired: boolean
  maxLength?: number
}

function CodeVerificationInput<T extends FieldValues>({
  phoneNumber,
  domain,
  formControl,
  isSubmitting,
  name,
  onExpired,
  expired,
  maxLength = 6,
}: CodeVerificationInputProps<T>) {
  const [isPending, startTransition] = useTransition()
  const [actionState, action] = useActionState(
    sendActivationCodeAction,
    undefined,
  )

  const timerRef = useRef<TimerRef>(null)

  const resetTimer = () => {
    timerRef.current?.restart(getTwoMinutesFromNow())
    onExpired(false)
  }

  const requestNewCode = () => {
    startTransition(() => action({
      phoneNumber,
      domain
    }))
  }

  useEffect(() => {
    if (actionState && !actionState.isSuccess && actionState.error) {
      toast.error('خطا', { description: actionState.error.detail })
    } else if (actionState && actionState.isSuccess) {
      toast.success('کد تایید مجددا برای شما ارسال شد !')
      resetTimer()
    }

    console.log(actionState)
  }, [actionState])

  const handleTimerExpire = () => {
    onExpired(true)
  }

  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem className="mb-5 w-full space-y-6">
          <div className="flex items-center justify-between gap-1">
            <FormLabel className="text-xs sm:text-sm">کد تایید</FormLabel>
            <FormDescription className="mb-1 text-xs sm:text-sm">
              کد تایید به شماره {phoneNumber} ارسال شد!
            </FormDescription>
          </div>
          <FormControl>
            <InputOTP
              disabled={expired || isSubmitting || isPending}
              maxLength={maxLength}
              pattern={REGEXP_ONLY_DIGITS}
              autoFocus
              {...field}
            >
              <InputOTPGroup
                dir="ltr"
                className="mx-auto [&>*]:p-5 sm:[&>*]:p-6"
              >
                {Array.from({ length: maxLength }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </FormControl>
          <Timer
            onExpire={handleTimerExpire}
            expiryTimestamp={getTwoMinutesFromNow()}
            showDays={false}
            showHours={false}
            size="xs"
            ref={timerRef}
          />
          {expired && (
            <Button
              variant="link"
              type="button"
              size="sm"
              onClick={requestNewCode}
              isLoading={isPending}
              className="mx-auto flex cursor-pointer text-sm tracking-tighter hover:underline"
            >
              ارسال مجدد کد تایید
            </Button>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default CodeVerificationInput
