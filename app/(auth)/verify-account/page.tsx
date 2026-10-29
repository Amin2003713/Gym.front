import type { Metadata } from 'next'

import VerifyAccountForm from './_components/verify-account-form'

export const metadata: Metadata = { title: 'تأیید حساب' }

export default function VerifyAccountPage() {
  return <VerifyAccountForm />
}
