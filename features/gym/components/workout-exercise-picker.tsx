'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Check, Dumbbell, LoaderCircle, Search, Timer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { exerciseApi, exerciseCoverUrl, type ExerciseListItemDto } from '../api/exercises-api'

const field = 'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function WorkoutExercisePicker() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ExerciseListItemDto[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [resolved, setResolved] = useState<ExerciseListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await exerciseApi.list({ pageNumber: 1, pageSize: 50, search: search.trim() || undefined, languageCode: 'fa' })
      setItems(result.results ?? [])
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string; title?: string } }; message?: string }
      setError(err.response?.data?.detail || err.response?.data?.title || err.message || 'دریافت حرکات ناموفق بود.')
      setItems([])
    } finally { setLoading(false) }
  }, [search])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    let cancelled = false
    if (!selectedIds.length) { setResolved([]); return }
    setResolving(true)
    exerciseApi.byIds(selectedIds, 'fa').then(result => { if (!cancelled) setResolved(result ?? []) }).catch(() => { if (!cancelled) toast.error('بازیابی حرکات انتخاب‌شده ناموفق بود.') }).finally(() => { if (!cancelled) setResolving(false) })
    return () => { cancelled = true }
  }, [selectedIds])

  const toggle = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])

  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="border-b p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Dumbbell className="size-5" /></span><div><h2 className="font-bold">انتخاب حرکات جلسه</h2><p className="mt-1 text-xs text-muted-foreground">فهرست واقعی از API حرکات دریافت می‌شود.</p></div></div><label className="relative mt-4 block"><span className="sr-only">جست‌وجوی حرکت</span><Search className="absolute right-3 top-3 size-4 text-muted-foreground" /><input className={`${field} pr-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="جست‌وجوی حرکت..." /></label></div>
      {error && <div role="alert" className="m-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"><AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" /><span>{error}</span><button onClick={() => void load()} className="mr-auto underline">تلاش دوباره</button></div>}
      <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">{loading ? <div className="flex min-h-40 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-primary" /></div> : items.length ? items.map(item => { const checked = selectedIds.includes(item.id); const cover = exerciseCoverUrl(item.cover); return <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-primary/60 bg-primary/5' : 'hover:bg-muted/50'}`}><input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="size-4 accent-[var(--primary)]" /><span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60">{cover ? <img src={cover} alt="" className="h-full w-full object-contain" /> : <Dumbbell className="size-5 text-muted-foreground" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{[item.bodyPart,item.equipment,item.target].filter(Boolean).join(' · ') || item.category || 'حرکت تمرینی'}</span></span>{checked && <Check className="size-4 shrink-0 text-primary" />}</label> }) : !error ? <p className="p-8 text-center text-sm text-muted-foreground">حرکتی پیدا نشد.</p> : null}</div>
    </section>
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">پیش‌نویس جلسه</h2><p className="mt-1 text-xs text-muted-foreground">{selectedIds.length.toLocaleString('fa-IR')} حرکت انتخاب‌شده</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Timer className="size-5" /></span></div>
      {resolving && <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> دریافت جزئیات حرکات از by-ids...</p>}
      {resolved.length ? <ol className="mt-4 space-y-2">{resolved.map((item,index) => <li key={item.id} className="flex items-center gap-3 rounded-xl border p-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">{(index+1).toLocaleString('fa-IR')}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span><button aria-label={`حذف ${item.name} از پیش‌نویس`} onClick={() => toggle(item.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button></li>)}</ol> : <div className="mt-5 flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center"><Dumbbell className="size-7 text-muted-foreground/60" /><p className="mt-3 text-sm font-semibold">هنوز حرکتی انتخاب نشده</p><p className="mt-1 text-xs leading-5 text-muted-foreground">از فهرست سمت راست حرکات موردنیاز را انتخاب کنید.</p></div>}
      <div className="mt-5 space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4"><p className="text-sm font-semibold">ذخیره جلسه هنوز متصل نیست</p><p className="text-xs leading-6 text-muted-foreground">در قراردادهای ارسال‌شده فقط API حرکات وجود داشت. برای شروع جلسه و ذخیره ست‌ها به endpoint و DTOهای واقعی Workout نیاز است؛ تا آن زمان این انتخاب‌ها فقط پیش‌نویس همین صفحه‌اند و به سرور ارسال نمی‌شوند.</p></div>
      <button type="button" disabled className={`${button} mt-4 w-full bg-primary text-primary-foreground`}><Timer className="size-4" /> شروع و ذخیره جلسه</button>
    </section>
  </div>
}
