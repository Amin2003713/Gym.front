import { MemberShell } from '../_components/member-shell'
import { getUserInfo } from '../layout'

export default async function MemberAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: user, error } = await getUserInfo()

  return (
    <MemberShell user={user} error={error}>
      {children}
    </MemberShell>
  )
}
