import { redirect } from 'next/navigation'

import { StaffDashboard } from '@/features/gym/components/staff-dashboard'

import { getUserInfo } from '../../layout'

/**
 * Staff dashboard for a gym host. The public marketing site owns `/` on the base domain, so this
 * page lives at an internal path and the proxy rewrites a tenant's `/` onto it.
 *
 * Roles enum of the API: trainees own the member app, staff keep the gym console.
 */
const TRAINEE = 2

export default async function GymConsoleHomePage() {
  const { data: user } = await getUserInfo()
  const roles = (Array.isArray(user?.role) ? user.role : [user?.role]).map(Number)

  // A trainee-only account never sees the console; send it to its own training app.
  if (roles.length > 0 && roles.every((role) => role === TRAINEE)) redirect('/home')

  return <StaffDashboard />
}
