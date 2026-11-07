'use client'

import Link from 'next/link'
import { useState } from 'react'

import { LayoutGrid } from '@/components/icons'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import { MEMBER_FEATURE_GROUPS } from './member-feature-groups'

/**
 * The mobile "all features" entry: every member route, grouped, in one animated sheet. The tab bar
 * keeps the five daily routes; this is how the other eleven stay reachable without a dropdown.
 */
export function MemberFeatureSheet({ active }: { active?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="همه امکانات"
          className="text-muted-foreground flex min-w-0 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors hover:text-primary"
        >
          <span className="flex h-8 w-10 items-center justify-center rounded-full">
            <LayoutGrid className="size-5" aria-hidden />
          </span>
          همه
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="safe-bottom max-h-[85svh] overflow-y-auto rounded-t-2xl sm:max-w-none"
      >
        <SheetHeader className="text-start">
          <SheetTitle>همه امکانات</SheetTitle>
          <SheetDescription>هر بخش تمرین، تحلیل و حساب در یک نگاه.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {MEMBER_FEATURE_GROUPS.map((group) => (
            <section key={group.key} className="space-y-2">
              <h3 className="text-muted-foreground text-[11px] font-bold tracking-wide">
                {group.label}
              </h3>
              <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:grid-cols-4">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active === href ? 'page' : undefined}
                    className={`focus-visible:ring-ring flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-[background-color,border-color,transform] duration-150 active:scale-[.98] focus-visible:ring-[3px] focus-visible:ring-offset-2 ${
                      active === href
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'bg-card hover:border-primary/30 hover:bg-muted/60'
                    }`}
                  >
                    <Icon className="size-5" aria-hidden />
                    <span className="text-[11px] leading-4 font-semibold">{label}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
