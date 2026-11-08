import type { Metadata } from 'next'

import { AdminSignin } from '@/features/platform/admin/admin-signin'

export const metadata: Metadata = {
  title: 'ورود به پنل پلتفرم',
  robots: { index: false, follow: false },
}

export default function AdminSigninPage() {
  return <AdminSignin />
}
