import { cache } from 'react'

import { OnboardingTour } from '@/app/(tenant)/_components/onboarding/onboarding-tour'
import { readData } from '@/core/http-service'
import { ConfirmProvider } from '@/lib/confirm'
import { AuthProvider } from '@/providers/auth-provider'
import { Problem } from '@/types/http-errors.interface'
import { PublicUser } from '@/types/user.interface'

export type TenantShellUser = {
  data: PublicUser | null
  error: Problem | null
}

/**
 * The one place the tenant area learns who is signed in. Both role shells (console and member
 * app) receive this, so neither has to repeat the request or the error handling.
 */
export const getUserInfo = cache(
  async (): Promise<TenantShellUser> =>
    readData<PublicUser>('user/user-info')
      .then((data) => ({ data, error: null }))
      .catch((err: unknown) => ({ data: null, error: err as Problem })),
)

export default async function TenantLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider>
      {/* One dialog surface for the whole tenant area: no native confirm/prompt anywhere. */}
      <ConfirmProvider>
        {/* Mounted once for both role shells; renders only while the tour is unfinished. */}
        <OnboardingTour />
        {children}
      </ConfirmProvider>
    </AuthProvider>
  )
}
