'use client'

import { useCallback, useEffect, useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listMyWorkouts, startWorkout } from './_api/workout-api'
import { WorkoutSessionPanel } from './_component/workout-session-panel'
import type { WorkoutListItem, WorkoutSessionType } from './_model/workout.types'

export default function WorkoutsPage() {
  const [items, setItems] = useState<WorkoutListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listMyWorkouts(type as WorkoutSessionType | '')
      setItems(Array.isArray(result) ? result : result.items ?? result.results ?? [])
    } catch (e) { toast.error('دریافت سوابق تمرین ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
    finally { setLoading(false) }
  }, [type])
  useEffect(() => { void load() }, [load])

  const start = async (mode: 'free' | 'planned') => {
    if (mode === 'planned') return toast.error('برای شروع تمرین برنامه‌ریزی‌شده، از پیش‌نمایش جلسه بعد در تخصیص مربوطه استفاده کنید.')
    setStarting(true)
    try {
      const result = await startWorkout({ mode: 'free', assignmentId: null, planDayId: null })
      const id = result.sessionId ?? result.id
      if (!id) throw new Error('پاسخ API شناسه جلسه را برنگرداند.')
      setActiveSessionId(id)
      if (result.resumed) toast.success('تمرین در حال اجرا بازیابی شد')
    } catch (e) { toast.error('شروع تمرین ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' }) }
    finally { setStarting(false) }
  }
  if (activeSessionId) return <div className="space-y-4" dir="rtl"><div className="flex justify-between"><h1 className="text-2xl font-bold">جلسه تمرین</h1><Button variant="outline" onClick={() => { setActiveSessionId(null); void load() }}>بازگشت به سوابق</Button></div><WorkoutSessionPanel sessionId={activeSessionId} onClosed={() => { setActiveSessionId(null); void load() }} /></div>

  return <div className="space-y-5" dir="rtl">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">تمرین‌ها</h1><p className="mt-1 text-sm text-muted-foreground">شروع تمرین آزاد، ثبت ست‌ها و مشاهده سوابق</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`} />بروزرسانی</Button><Button onClick={() => void start('free')} disabled={starting}><Play className="ml-2 size-4" />{starting ? 'در حال شروع…' : 'شروع تمرین آزاد'}</Button></div></div>
    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>سوابق تمرین</CardTitle><select className="h-10 rounded-md border bg-background px-3" value={type} onChange={e => setType(e.target.value)}><option value="">همه انواع</option><option value="Planned">برنامه‌ریزی‌شده</option><option value="Free">آزاد</option></select></CardHeader><CardContent>
      {loading ? <div className="py-12 text-center text-muted-foreground">در حال دریافت سوابق…</div> : !items.length ? <div className="py-12 text-center text-muted-foreground">هنوز جلسه تمرینی ثبت نشده است.</div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-right text-muted-foreground">{['عنوان','نوع','وضعیت','شروع','تکمیل','ست‌ها','حجم کل','عملیات'].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{items.map((item, i) => <tr key={`${item.id}-${i}`} className="border-b last:border-0 hover:bg-muted/30"><td className="p-3 font-medium">{item.title || 'جلسه تمرین'}</td><td className="p-3"><Badge variant="secondary">{item.type ?? '—'}</Badge></td><td className="p-3"><Badge variant={item.status === 'Completed' ? 'default' : item.status === 'Abandoned' ? 'destructive' : 'outline'}>{item.status ?? '—'}</Badge></td><td className="p-3" dir="ltr">{item.startedAt ? new Date(item.startedAt).toLocaleString() : '—'}</td><td className="p-3" dir="ltr">{item.completedAt ? new Date(item.completedAt).toLocaleString() : '—'}</td><td className="p-3">{item.totalSets ?? '—'}</td><td className="p-3">{item.totalVolumeKg != null ? `${item.totalVolumeKg.toLocaleString()} kg` : '—'}</td><td className="p-3">{item.status === 'InProgress' && <Button size="sm" onClick={() => setActiveSessionId(item.sessionId ?? item.id)}>ادامه تمرین</Button>}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </div>
}
