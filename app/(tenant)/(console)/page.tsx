import { redirect } from 'next/navigation'

import { RoleDashboard } from '@/features/gym/components/role-dashboard'

import { getUserInfo } from '../layout'

/** Roles enum of the API: trainees own the member app, staff keep the console. */
const TRAINEE = 2

export default async function GymGroupDashboardPage() {
  const { data: user } = await getUserInfo()
  const roles = (Array.isArray(user?.role) ? user.role : [user?.role]).map(Number)

  if (roles.length > 0 && roles.every((role) => role === TRAINEE)) redirect('/home')

  return <RoleDashboard />
}
