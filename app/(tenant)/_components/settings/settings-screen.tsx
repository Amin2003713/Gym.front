'use client'

import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { AlertsPanel } from './panels/alerts-panel'
import { EquipmentPanel } from './panels/equipment-panel'
import { LookPanel } from './panels/look-panel'
import { PlanPanel } from './panels/plan-panel'
import { AboutPanel, AdvancedPanel, DataPanel } from './panels/system-panels'
import type { PanelProps } from './panels/types'
import { UnitsPanel } from './panels/units-panel'
import { WorkoutPanel } from './panels/workout-panel'
import { SETTINGS_SECTIONS, findSettingsSection } from './settings-sections'
import { usePreferences } from './use-preferences'

const PANELS: Record<string, React.ComponentType<PanelProps>> = {
  units: UnitsPanel,
  workout: WorkoutPanel,
  plan: PlanPanel,
  alerts: AlertsPanel,
  equipment: EquipmentPanel,
  look: LookPanel,
  advanced: AdvancedPanel,
  data: DataPanel,
  about: AboutPanel,
}

/**
 * One section of the settings hub. The section is a route segment, the panels are a registry, and
 * every write goes through the same draft + save bar, so a section cannot persist on its own.
 */
export function SettingsScreen({ section }: { section: string }) {
  const pathname = usePathname()
  const meta = findSettingsSection(section)
  const form = usePreferences()
  const Panel = PANELS[section]

  if (!meta || !Panel) return null

  return (
    <div className="space-y-4 pb-20">
      <header className="space-y-2">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowRight className="size-3.5" />
          تنظیمات
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">{meta.label}</h1>
        <p className="text-muted-foreground text-sm leading-6">{meta.hint}</p>
      </header>

      <nav className="flex gap-1.5 overflow-x-auto pb-1">
        {SETTINGS_SECTIONS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              pathname === item.href
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="bg-card rounded-2xl border p-4 shadow-sm">
        <Panel draft={form.draft} update={form.update} replace={form.replace} />
      </section>

      {form.dirty && (
        <div className="bg-card/95 supports-[backdrop-filter]:bg-card/85 sticky bottom-20 z-30 flex items-center justify-between gap-3 rounded-2xl border p-3 shadow-lg backdrop-blur md:bottom-4">
          <span className="text-muted-foreground text-xs">تغییرات ذخیره نشده</span>
          <Button size="sm" onClick={() => void form.save()} disabled={form.saving}>
            <Check className="size-4" />
            {form.saving ? 'در حال ذخیره…' : 'ذخیره'}
          </Button>
        </div>
      )}
    </div>
  )
}
