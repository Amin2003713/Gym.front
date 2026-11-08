import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'پنل پلتفرم', template: '%s | پنل پلتفرم' },
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background text-foreground min-h-svh">{children}</div>
}
