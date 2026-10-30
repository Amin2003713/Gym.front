import { MyProfile } from '@/app/(tenant)/(app)/profile/_components/my-profile'

export const metadata = { title: 'پروفایل من | هم‌اوج' }

/** Console users share the same self-service profile editor as members. */
export default function ConsoleProfilePage() {
  return <MyProfile />
}
