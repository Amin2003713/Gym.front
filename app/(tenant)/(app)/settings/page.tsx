import { ChevronLeft } from '@/components/icons'
import Link from 'next/link'

import { SETTINGS_SECTIONS } from '@/app/(tenant)/_components/settings/settings-sections'

export const metadata = { title: 'تنظیمات' }

export default function Page() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">تنظیمات</h1>
        <p className="text-muted-foreground text-sm leading-6">
          واحدها، تمرین، اعلان‌ها و ظاهر برنامه — هر تغییر روی همین حساب می‌ماند.
        </p>
      </header>

      <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        {SETTINGS_SECTIONS.map((section) => (
          <li key={section.key}>
            <Link
              href={section.href}
              className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3.5 transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{section.label}</span>
                <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                  {section.hint}
                </span>
              </span>
              <ChevronLeft className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
