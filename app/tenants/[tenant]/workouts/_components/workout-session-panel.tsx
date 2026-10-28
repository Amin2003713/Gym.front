'use client'

import { CheckCircle2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'


import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import { addWorkoutExercise, abandonWorkout, completeWorkout, deleteLoggedSet, getWorkout, logWorkoutSets, removeWorkoutExercise, searchExercises, updateLoggedSet } from '../_api/workout-api'
import type { CompleteSessionResponse, ExerciseSearchItem, LoggedSetItem, SessionExerciseItem, SessionResponse } from '../_model/workout.types'

export function WorkoutSessionPanel({ sessionId, onClosed }: { sessionId: string; onClosed: () => void }) {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<ExerciseSearchItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, { reps: string; weightKg: string; rir: string; isWarmup: boolean }>>({})
  const [celebration, setCelebration] = useState<CompleteSessionResponse | null>(null)
  // Keep request IDs stable after a failed network request so retrying the same set is idempotent.
  const pendingRequestIds = useRef<Record<string, string>>({})
  const load = useCallback(async () => {
    setLoading(true)
    try { const s = await getWorkout(sessionId); setSession(s) }
    catch (e) { toast.error('دریافت جلسه تمرین ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
    finally { setLoading(false) }
  }, [sessionId])
  useEffect(() => { void load() }, [load])

  const findExercises = async () => {
    if (!search.trim()) return
    try { const r = await searchExercises({ query: search.trim() }); setSearchResults(r.items ?? []) }
    catch (e) { toast.error('جستجوی حرکت ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
  }
  const addExercise = async (ex: ExerciseSearchItem) => {
    setBusy(true)
    try { await addWorkoutExercise(sessionId, { exerciseId: ex.id }); toast.success('حرکت اضافه شد'); setSearchResults([]); setSearch(''); await load() }
    catch (e) { toast.error('افزودن حرکت ناموفق بود', { description: e instanceof Error ? e.message : 'ممکن است حرکت تکراری باشد.' }) }
    finally { setBusy(false) }
  }
  const logSet = async (ex: SessionExerciseItem) => {
    const d = drafts[ex.exerciseId] ?? { reps: String(ex.targetRepsMin ?? 10), weightKg: '0', rir: '', isWarmup: false }
    if (!Number.isFinite(Number(d.reps)) || Number(d.reps) < 0 || !Number.isFinite(Number(d.weightKg)) || Number(d.weightKg) < 0) return toast.error('تکرار و وزنه باید عدد معتبر باشند')
    const setNumber = (ex.sets?.reduce((max, s) => Math.max(max, s.setNumber), 0) ?? 0) + 1
    const requestKey = `${ex.exerciseId}:${setNumber}`
    const clientRequestId = pendingRequestIds.current[requestKey] ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${ex.exerciseId}-${setNumber}`)
    pendingRequestIds.current[requestKey] = clientRequestId
    setBusy(true)
    try {
      await logWorkoutSets(sessionId, { sets: [{ exerciseId: ex.exerciseId, ...(ex.planDayExerciseId ? { planDayExerciseId: ex.planDayExerciseId } : {}), setNumber, reps: Number(d.reps), weightKg: Number(d.weightKg), ...(d.rir !== '' ? { rir: Number(d.rir) } : {}), isWarmup: d.isWarmup, clientRequestId }] })
      delete pendingRequestIds.current[requestKey]
      toast.success('ست ثبت شد'); await load()
    } catch (e) { toast.error('ثبت ست ناموفق بود', { description: e instanceof Error ? e.message : 'در صورت retry از همان شناسه درخواست استفاده کنید.' }) }
    finally { setBusy(false) }
  }
  const closeSession = async (mode: 'complete' | 'abandon') => {
    if (mode === 'abandon' && !window.confirm('جلسه تمرین رها شود؟ پیشرفت برنامه ثبت نمی‌شود.')) return
    setBusy(true)
    try {
      if (mode === 'complete') { setCelebration(await completeWorkout(sessionId)); toast.success('تمرین تکمیل شد') }
      else { await abandonWorkout(sessionId); toast.success('تمرین رها شد') }
      await load()
      if (mode === 'abandon') onClosed()
    } catch (e) { toast.error(mode === 'complete' ? 'تکمیل تمرین ناموفق بود' : 'رها کردن تمرین ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
    finally { setBusy(false) }
  }
  const removeExtra = async (ex: SessionExerciseItem) => {
    if (!window.confirm('این حرکت اضافی حذف شود؟')) return
    try { await removeWorkoutExercise(sessionId, ex.exerciseId); toast.success('حرکت حذف شد'); await load() }
    catch (e) { toast.error('حذف حرکت ناموفق بود', { description: e instanceof Error ? e.message : 'فقط حرکت اضافی بدون ست ثبت‌شده قابل حذف است.' }) }
  }
  const editSet = async (set: LoggedSetItem) => {
    const reps = window.prompt('تعداد تکرار', String(set.reps)); if (reps === null) return
    const weight = window.prompt('وزنه (کیلوگرم)', String(set.weightKg)); if (weight === null) return
    try { await updateLoggedSet(set.setId, { reps: Number(reps), weightKg: Number(weight), ...(set.rir != null ? { rir: set.rir } : {}), isWarmup: set.isWarmup }); toast.success('ست ویرایش شد'); await load() }
    catch (e) { toast.error('ویرایش ست ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
  }
  const deleteSet = async (set: LoggedSetItem) => {
    if (!window.confirm('ست حذف شود؟')) return
    try { await deleteLoggedSet(set.setId); toast.success('ست حذف شد'); await load() }
    catch (e) { toast.error('حذف ست ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
  }

  if (loading && !session) return <Card><CardContent className="py-10 text-center">در حال بارگذاری جلسه…</CardContent></Card>
  if (!session) return <Card><CardContent className="py-10 text-center">جلسه تمرین بارگذاری نشد.</CardContent></Card>
  return <div className="space-y-4" dir="rtl">
    <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>{session.title || 'جلسه تمرین'}</CardTitle><p className="mt-1 text-sm text-muted-foreground">شناسه: <span dir="ltr">{session.id ?? session.sessionId}</span></p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="ml-1 size-4" />تازه‌سازی</Button><Button onClick={() => void closeSession('complete')} disabled={busy || session.status !== 0 /* InProgress (numeric enum) */}><CheckCircle2 className="ml-1 size-4" />تکمیل تمرین</Button><Button variant="outline" onClick={() => void closeSession('abandon')} disabled={busy || session.status !== 0}>رها کردن</Button></div></CardHeader><CardContent><Badge>{session.status === 0 ? 'در جریان' : session.status === 1 ? 'تکمیل‌شده' : session.status === 2 ? 'لغوشده' : '—'}</Badge> <Badge variant="secondary">{session.type === 0 ? 'برنامه‌ریزی‌شده' : session.type === 1 ? 'آزاد' : 'Workout'}</Badge></CardContent></Card>
    {celebration && <Card><CardContent className="space-y-2 p-4"><h3 className="text-lg font-bold">آفرین! تمرین کامل شد 🎉</h3><p>حجم کل: {celebration.totalVolumeKg.toLocaleString()} کیلوگرم · {celebration.totalSets} ست · {celebration.distinctExercises} حرکت · {celebration.durationMinutes} دقیقه</p>{celebration.newPrs?.length > 0 && <div><p className="font-semibold">رکوردهای جدید</p>{celebration.newPrs.map(pr => <p key={pr.exerciseId}>{pr.exerciseName ?? pr.exerciseId}: {pr.weightKg} کیلوگرم (e1RM: {pr.e1Rm})</p>)}</div>}{celebration.assignmentCompleted && <p className="font-semibold">برنامه تمرینی به پایان رسید.</p>}<Button onClick={() => { setCelebration(null); onClosed() }}>بازگشت به فهرست</Button></CardContent></Card>}
    <Card><CardHeader><CardTitle>افزودن حرکت</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی نام حرکت" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void findExercises() } }} /><Button onClick={() => void findExercises()} disabled={busy}><Plus className="ml-1 size-4" />جستجو</Button></div>{searchResults.map(ex => <div key={ex.id} className="flex items-center justify-between border-b py-2 text-sm"><div><p className="font-medium">{ex.name}</p><p className="text-muted-foreground">{ex.category ?? 'بدون دسته‌بندی'} · {ex.equipment ?? 'تجهیزات نامشخص'}</p></div><Button size="sm" variant="outline" onClick={() => void addExercise(ex)} disabled={busy}>افزودن</Button></div>)}</CardContent></Card>
    {!session.exercises?.length ? <Card><CardContent className="py-10 text-center text-muted-foreground">هنوز حرکتی در این جلسه نیست.</CardContent></Card> : session.exercises.map(ex => <Card key={ex.exerciseId}><CardHeader className="flex flex-row items-start justify-between"><div><CardTitle>{ex.exerciseName ?? ex.exerciseId}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{ex.isPlanned ? 'حرکت برنامه‌ریزی‌شده' : 'حرکت اضافه'}{ex.targetSets ? ` · هدف ${ex.targetSets} ست` : ''}{ex.targetRepsMin ? ` · ${ex.targetRepsMin}–${ex.targetRepsMax ?? ex.targetRepsMin} تکرار` : ''}</p>{ex.suggestion && <p className="mt-1 text-xs text-muted-foreground">پیشنهاد: {ex.suggestion.suggestedWeightKg ?? '—'} کیلوگرم × {ex.suggestion.suggestedReps ?? '—'} تکرار</p>}</div>{ex.isExtra && <Button size="sm" variant="ghost" onClick={() => void removeExtra(ex)}><Trash2 className="ml-1 size-4" />حذف حرکت</Button>}</CardHeader><CardContent className="space-y-3">
      {ex.sets?.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-right"><th className="p-2">ست</th><th className="p-2">تکرار</th><th className="p-2">وزنه</th><th className="p-2">نوع</th><th className="p-2">عملیات</th></tr></thead><tbody>{ex.sets.map(s => <tr key={s.setId} className="border-b"><td className="p-2">{s.setNumber}</td><td className="p-2">{s.reps}</td><td className="p-2">{s.weightKg} kg</td><td className="p-2">{s.isWarmup ? 'گرم‌کردن' : 'اصلی'}</td><td className="p-2"><Button size="sm" variant="ghost" onClick={() => void editSet(s)}>ویرایش</Button><Button size="sm" variant="ghost" onClick={() => void deleteSet(s)}><Trash2 className="size-3 text-destructive" /></Button></td></tr>)}</tbody></table></div>}
      <div className="grid gap-2 sm:grid-cols-4"><label className="space-y-1 text-xs"><span>تکرار</span><Input type="number" min="0" value={drafts[ex.exerciseId]?.reps ?? String(ex.targetRepsMin ?? 10)} onChange={e => setDrafts(old => ({ ...old, [ex.exerciseId]: { ...(old[ex.exerciseId] ?? { reps: String(ex.targetRepsMin ?? 10), weightKg: '0', rir: '', isWarmup: false }), reps: e.target.value } }))} /></label><label className="space-y-1 text-xs"><span>وزنه (کیلوگرم)</span><Input type="number" min="0" step="0.25" value={drafts[ex.exerciseId]?.weightKg ?? '0'} onChange={e => setDrafts(old => ({ ...old, [ex.exerciseId]: { ...(old[ex.exerciseId] ?? { reps: String(ex.targetRepsMin ?? 10), weightKg: '0', rir: '', isWarmup: false }), weightKg: e.target.value } }))} /></label><label className="space-y-1 text-xs"><span>RIR</span><Input type="number" min="0" max="10" value={drafts[ex.exerciseId]?.rir ?? ''} onChange={e => setDrafts(old => ({ ...old, [ex.exerciseId]: { ...(old[ex.exerciseId] ?? { reps: String(ex.targetRepsMin ?? 10), weightKg: '0', rir: '', isWarmup: false }), rir: e.target.value } }))} /></label><label className="flex items-center gap-2 pt-5 text-sm"><input type="checkbox" checked={drafts[ex.exerciseId]?.isWarmup ?? false} onChange={e => setDrafts(old => ({ ...old, [ex.exerciseId]: { ...(old[ex.exerciseId] ?? { reps: String(ex.targetRepsMin ?? 10), weightKg: '0', rir: '', isWarmup: false }), isWarmup: e.target.checked } }))} />ست گرم‌کردن</label></div>
      <Button onClick={() => void logSet(ex)} disabled={busy || session.status !== 0 /* InProgress (numeric enum) */}>ثبت ست جدید</Button>
    </CardContent></Card>)}
  </div>
}
