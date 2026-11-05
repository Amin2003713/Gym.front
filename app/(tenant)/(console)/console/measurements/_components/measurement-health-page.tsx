'use client'


import { Plus, Trash2 } from '@/components/icons'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PersianDateInput } from '@/components/ui/persian-date-input'
import { toast } from '@/lib/toast'

import {
  fieldDelta,
  listConditions,
  listMeasurements,
  saveConditions,
  saveMeasurements,
} from '../_model/health-store'
import {
  CONDITION_TYPE_LABELS,
  MEASUREMENT_FIELDS,
  SEVERITY_LABELS,
  type HealthConditionEntry,
  type HealthConditionKind,
  type MeasurementEntry,
} from '../_model/health.types'

import { MeasurementTrendChart } from './measurement-charts'

const fa = (n: number) => n.toLocaleString('fa-IR')
const tabKey = 'measurements-page-tab'

const LOCAL_STORAGE_NOTICE =
  'ذخیره‌سازی فعلی در همین مرورگر انجام می‌شود (حالت انتظار API) و به سرور ارسال نمی‌شود.'

function StaticTabBar({ active, onChange }: { active: string; onChange: (t: 'measurements' | 'conditions') => void }) {
  const tabs: { key: 'measurements' | 'conditions'; label: string }[] = [
    { key: 'measurements', label: 'اندازه‌گیری‌های بدن' },
    { key: 'conditions', label: 'شرایط سلامت و محدودیت‌ها' },
  ]
  return (
    <div className="bg-card flex gap-2 overflow-x-auto rounded-lg border p-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={
            active === tab.key
              ? 'bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold'
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function MeasurementHealthPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? 'self'

  const [tab, setTab] = useState<'measurements' | 'conditions'>('measurements')

  // Measurements
  const [entries, setEntries] = useState<MeasurementEntry[]>([])
  const [measuredAt, setMeasuredAt] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Health conditions / disabilities
  const [conditions, setConditions] = useState<HealthConditionEntry[]>([])
  const [cKind, setCKind] = useState<HealthConditionKind>('condition')
  const [cTitle, setCTitle] = useState('')
  const [cSeverity, setCSeverity] = useState<HealthConditionEntry['severity']>('mild')
  const [cNotes, setCNotes] = useState('')

  useEffect(() => {
    // Deferred a tick so the restored tab and stored rows don't cascade into the first render.
    const timer = window.setTimeout(() => {
      setEntries(listMeasurements(userId))
      setConditions(listConditions(userId))

      const savedTab = window.localStorage.getItem(tabKey)

      if (savedTab === 'conditions') setTab('conditions')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [userId])

  const changeTab = (next: 'measurements' | 'conditions') => {
    setTab(next)
    window.localStorage.setItem(tabKey, next)
  }

  const nowIso = () => new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (measuredAt) return

    const timer = window.setTimeout(() => setMeasuredAt(nowIso()), 0)

    return () => window.clearTimeout(timer)
  }, [measuredAt])

  const resetForm = () => {
    setEditingId(null)
    setValues({})
    setNotes('')
    setMeasuredAt(nowIso())
  }

  const persistMeasurements = (next: MeasurementEntry[]) => {
    setEntries(next)
    saveMeasurements(userId, next)
  }

  const addOrUpdateMeasurement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed: MeasurementEntry = {
      ...Object.fromEntries(
        MEASUREMENT_FIELDS.map((f) => [f.key, values[f.key]?.trim() ? Number(values[f.key]) : null]),
      ) as unknown as MeasurementEntry,
      id: editingId ?? crypto.randomUUID(),
      measuredAt,
      notes: notes.trim() || null,
    }
    const hasAnyValue = MEASUREMENT_FIELDS.some((f) => values[f.key]?.trim())
    if (!hasAnyValue) {
      toast.error('حداقل یک اندازه‌گیری وارد کنید')
      return
    }
    if (editingId) {
      persistMeasurements(entries.map((e) => (e.id === editingId ? parsed : e)))
      toast.success('اندازه‌گیری به‌روزرسانی شد')
    } else {
      persistMeasurements([...entries, parsed].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)))
      toast.success('اندازه‌گیری ثبت شد')
    }
    resetForm()
  }

  const startEdit = (entry: MeasurementEntry) => {
    setEditingId(entry.id)
    setMeasuredAt(entry.measuredAt.slice(0, 10))
    setNotes(entry.notes ?? '')
    setValues(
      Object.fromEntries(
        MEASUREMENT_FIELDS.map((f) => [f.key, entry[f.key] == null ? '' : String(entry[f.key])]),
      ),
    )
  }

  const removeMeasurement = (id: string) => {
    if (!window.confirm('این اندازه‌گیری حذف شود؟')) return
    persistMeasurements(entries.filter((e) => e.id !== id))
    if (editingId === id) resetForm()
  }

  const persistConditions = (next: HealthConditionEntry[]) => {
    setConditions(next)
    saveConditions(userId, next)
  }

  const addCondition = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cTitle.trim()) return void toast.error('عنوان وضعیت سلامت الزامی است')
    persistConditions([
      {
        id: crypto.randomUUID(),
        kind: cKind,
        title: cTitle.trim(),
        severity: cSeverity,
        notes: cNotes.trim() || null,
        createdAt: new Date().toISOString(),
      },
      ...conditions,
    ])
    toast.success('وضعیت سلامت ثبت شد')
    setCTitle('')
    setCNotes('')
  }

  const deltas = useMemo(
    () =>
      MEASUREMENT_FIELDS.map((f) => ({ field: f, delta: fieldDelta(entries, f.key) })).filter(
        (row) => row.delta != null,
      ),
    [entries],
  )

  return (
    <div className="space-y-5" dir="rtl">
      <header className="bg-card rounded-lg border p-5 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">سلامت و اندازه‌گیری‌های بدن</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          اندازه‌گیری‌های مهم بدن، شرایط پزشکی، محدودیت‌ها و آسیب‌ها را ثبت کنید تا روند پیشرفت
          و برنامه مربی بر اساس آن‌ها شکل بگیرد.
        </p>
      </header>

      <StaticTabBar active={tab} onChange={changeTab} />

      {tab === 'measurements' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'ویرایش اندازه‌گیری' : 'ثبت اندازه‌گیری'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 sm:grid-cols-3" onSubmit={addOrUpdateMeasurement}>
                <label className="space-y-1 text-sm">
                  <span>تاریخ *</span>
                  <PersianDateInput value={measuredAt} onValueChange={setMeasuredAt} />
                </label>
                {MEASUREMENT_FIELDS.map((f) => (
                  <label key={f.key} className="space-y-1 text-sm">
                    <span>
                      {f.label} <span className="text-muted-foreground text-xs">({f.unit})</span>
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={values[f.key] ?? ''}
                      onChange={(e) => setValues((old) => ({ ...old, [f.key]: e.target.value }))}
                    />
                  </label>
                ))}
                <label className="space-y-1 text-sm sm:col-span-3">
                  <span>یادداشت</span>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثلاً صبح ناشتا" />
                </label>
                <div className="flex gap-2 sm:col-span-3">
                  <Button type="submit">{editingId ? 'ذخیره تغییرات' : 'ثبت اندازه‌گیری'}</Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      انصراف
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {deltas.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {deltas.map(({ field, delta }) => (
                <div key={field.key} className="bg-card rounded-lg border p-4 shadow-sm">
                  <p className="text-muted-foreground text-sm">{field.label}</p>
                  <p className="mt-2 text-2xl font-extrabold" dir="ltr">
                    {fa(Math.round(delta!.to * 10) / 10)} <span className="text-sm font-medium">{field.unit}</span>
                  </p>
                  <p
                    className={
                      delta!.diff < 0
                        ? 'mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400'
                        : 'mt-1 text-sky-600 text-xs font-bold dark:text-sky-400'
                    }
                    dir="ltr"
                  >
                    {delta!.diff > 0 ? '+' : ''}
                    {fa(Math.round(delta!.diff * 10) / 10)} {field.unit} از شروع
                  </p>
                </div>
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>روند اندازه‌گیری‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <MeasurementTrendChart entries={entries} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>تاریخچه</CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  هنوز اندازه‌گیری‌ای ثبت نشده است.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="text-muted-foreground text-right">
                        <th className="p-3 font-medium">تاریخ</th>
                        {MEASUREMENT_FIELDS.map((f) => (
                          <th key={f.key} className="p-3 font-medium">
                            {f.label}
                          </th>
                        ))}
                        <th className="p-3 font-medium">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...entries].reverse().map((entry) => (
                        <tr key={entry.id} className="hover:bg-muted/30 border-b last:border-0">
                          <td className="p-3 font-medium" dir="ltr">{entry.measuredAt.slice(0, 10)}</td>
                          {MEASUREMENT_FIELDS.map((f) => (
                            <td key={f.key} className="p-3" dir="ltr">
                              {entry[f.key] == null ? '—' : fa(Number(entry[f.key]))}
                            </td>
                          ))}
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>
                                ویرایش
                              </Button>
                              <Button size="icon" variant="ghost" title="حذف" onClick={() => removeMeasurement(entry.id)}>
                                <Trash2 className="text-destructive size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>شرایط سلامت، محدودیت‌ها و آسیب‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={addCondition}>
              <label className="space-y-1 text-sm">
                <span>نوع *</span>
                <select
                  className="h-10 rounded-lg border bg-background px-3"
                  value={cKind}
                  onChange={(e) => setCKind(e.target.value as HealthConditionKind)}
                >
                  {Object.entries(CONDITION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>شدت</span>
                <select
                  className="h-10 rounded-lg border bg-background px-3"
                  value={cSeverity}
                  onChange={(e) => setCSeverity(e.target.value as HealthConditionEntry['severity'])}
                >
                  {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>عنوان *</span>
                <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="مثلاً کمردرد مزمن" required />
              </label>
              <label className="space-y-1 text-sm">
                <span>توضیح</span>
                <Input value={cNotes} onChange={(e) => setCNotes(e.target.value)} placeholder="مثلاً حرکات خم‌کننده کمر ممنوع" />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">
                  <Plus className="ml-2 size-4" />
                  افزودن
                </Button>
              </div>
            </form>

            {conditions.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                هیچ وضعیت سلامتی ثبت نشده است.
              </p>
            ) : (
              <ul className="space-y-2">
                {conditions.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm">{entry.title}</strong>
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                          {CONDITION_TYPE_LABELS[entry.kind]}
                        </span>
                        <span className="text-muted-foreground text-xs">{SEVERITY_LABELS[entry.severity]}</span>
                      </div>
                      {entry.notes && <p className="text-muted-foreground mt-1 text-xs leading-5">{entry.notes}</p>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="حذف"
                      onClick={() => {
                        if (!window.confirm(`«${entry.title}» حذف شود؟`)) return
                        persistConditions(conditions.filter((c) => c.id !== entry.id))
                      }}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs leading-5">
        🔒 {LOCAL_STORAGE_NOTICE}
      </p>
    </div>
  )
}
