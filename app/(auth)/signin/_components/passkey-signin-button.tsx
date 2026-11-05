'use client'

import { startAuthentication } from '@simplewebauthn/browser'
import { Fingerprint, LoaderCircle } from '@/components/icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  getPasskeyLoginOptionsAction,
  verifyPasskeyLoginAction,
} from '@/actions/auth'
import { toast } from '@/lib/toast'

type PasskeyRequestOptions = Parameters<typeof startAuthentication>[0]

export function PasskeySigninButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handlePasskeySignin = async () => {
    if (isPending) return

    // WebAuthn requires a supported browser and a secure context.
    if (
      typeof window === 'undefined' ||
      !window.isSecureContext ||
      !('credentials' in navigator) ||
      !('PublicKeyCredential' in window)
    ) {
      toast.error('ورود با کلید عبور در این مرورگر پشتیبانی نمی‌شود.')
      return
    }

    setIsPending(true)

    try {
      // Step 1: Request a challenge and WebAuthn options from the backend.
      const optionsResult = await getPasskeyLoginOptionsAction()

      if (!optionsResult.isSuccess || !optionsResult.response) {
        toast.error(
          optionsResult.error?.detail ??
            'دریافت اطلاعات ورود با کلید عبور ناموفق بود.',
        )
        return
      }

      const { cid, optionsJson } = optionsResult.response

      if (!cid || !optionsJson) {
        toast.error('اطلاعات ورود با کلید عبور ناقص است.')
        return
      }

      // Step 2: Parse the backend options using the type expected by
      // the installed version of @simplewebauthn/browser.
      let optionsJSON: PasskeyRequestOptions

      try {
        optionsJSON = JSON.parse(optionsJson) as PasskeyRequestOptions
      } catch {
        toast.error('اطلاعات ورود با کلید عبور معتبر نیست.')
        return
      }

      // Step 3: Ask the browser to authenticate using a registered passkey.
      const assertion = await startAuthentication(optionsJSON)

      // Step 4: Verify the assertion on the backend.
      const loginResult = await verifyPasskeyLoginAction({
        cid,
        assertion: JSON.stringify(assertion),
      })

      if (!loginResult.isSuccess) {
        toast.error(
          loginResult.error?.detail ??
            'ورود با کلید عبور ناموفق بود.',
        )
        return
      }

      // Step 5: Refresh the existing NextAuth session and navigate.
      toast.success('خوش آمدید')
      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      // Dismissing the browser's passkey prompt is not necessarily an error.
      if (
        error instanceof Error &&
        /cancel|abort|notallowed/i.test(
          `${error.name} ${error.message}`,
        )
      ) {
        return
      }

      console.error('Passkey sign-in failed:', error)

      toast.error('ورود با کلید عبور ناموفق بود. دوباره تلاش کنید.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePasskeySignin}
      disabled={isPending}
      aria-busy={isPending}
      className="border-border bg-background hover:bg-muted flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Fingerprint className="size-4" />
      )}

      <span>
        {isPending
          ? 'در حال احراز هویت...'
          : 'ورود با کلید عبور'}
      </span>
    </button>
  )
}
