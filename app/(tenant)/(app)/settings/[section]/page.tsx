import { notFound } from 'next/navigation'

import { SettingsScreen } from '@/app/(tenant)/_components/settings/settings-screen'
import { findSettingsSection } from '@/app/(tenant)/_components/settings/settings-sections'

export const metadata = { title: 'تنظیمات' }

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params

  if (!findSettingsSection(section)) notFound()

  return <SettingsScreen section={section} />
}
