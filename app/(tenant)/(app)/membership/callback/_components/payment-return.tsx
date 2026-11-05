'use client'

import { CheckCircle2, XCircle } from '@/components/icons'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { verifyPaymentByAuthority } from '@/app/(tenant)/_api/billing-api'
import { Button } from '@/components/ui/button'

type State =
  | { kind: 'verifying' }
  | { kind: 'paid'; reference: string | null }
  | { kind: 'failed'; message: string }

/**
 * Landing page of the payment gateway. It never trusts the query string: the authority is verified
 * with the tenant's merchant account on the server, and only that answer activates the purchase.
 */
export function PaymentReturn({
  authority,
  gatewayStatus,
}: {
  authority: string | null
  gatewayStatus: string | null
}) {
  const [state, setState] = useState<State>({ kind: 'verifying' })

  useEffect(() => {
    if (!authority) {
      setState({ kind: 'failed', message: 'کد پیگیری پرداخت در آدرس وجود ندارد.' })
      return
    }

    if (gatewayStatus && gatewayStatus.toUpperCase() !== 'OK') {
      setState({ kind: 'failed', message: 'پرداخت توسط شما لغو شد یا درگاه آن را نپذیرفت.' })
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const payment = await verifyPaymentByAuthority(authority)

        if (cancelled) return

        setState({ kind: 'paid', reference: payment.referenceId })
      } catch (error) {
        if (!cancelled)
          setState({
            kind: 'failed',
            message: error instanceof Error ? error.message : 'تأیید پرداخت ناموفق بود.',
          })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authority, gatewayStatus])

  return (
    <div className="mx-auto max-w-md space-y-4 py-10 text-center">
      {state.kind === 'verifying' && (
        <p className="text-muted-foreground text-sm">در حال تأیید پرداخت با درگاه…</p>
      )}

      {state.kind === 'paid' && (
        <>
          <CheckCircle2 className="text-primary mx-auto size-12" />
          <h1 className="text-xl font-extrabold">پرداخت با موفقیت انجام شد</h1>
          <p className="text-muted-foreground text-sm">
            اشتراک شما فعال شد.
            {state.reference ? ` شماره پیگیری: ${state.reference}` : ''}
          </p>
        </>
      )}

      {state.kind === 'failed' && (
        <>
          <XCircle className="text-destructive mx-auto size-12" />
          <h1 className="text-xl font-extrabold">پرداخت انجام نشد</h1>
          <p className="text-muted-foreground text-sm leading-6">{state.message}</p>
        </>
      )}

      <Button asChild>
        <Link href="/membership">بازگشت به اشتراک من</Link>
      </Button>
    </div>
  )
}
