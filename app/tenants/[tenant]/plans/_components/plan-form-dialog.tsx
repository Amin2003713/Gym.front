'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'


import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import { createPlan, getPlan, updatePlan } from '../_api/plan-api'
import type { PlanDetail, PlanDurationType, PlanGoal, PlanLevel, PlanSummary, PlanVisibility, PlanWriteRequest } from '../_model/plan.types'

import ExercisePicker, { type ExercisePickerSelection } from './exercise-picker'

type Props = { open: boolean; plan?: PlanSummary | null; onOpenChange: (open: boolean) => void; onSaved: () => void }
type ExerciseRow = { exerciseId: string; exerciseName: string; targetSets: string; targetRepsMin: string; targetRepsMax: string; targetRir: string; restSeconds: string; notes: string }
type DayRow = { name: string; exercises: ExerciseRow[] }
const blankExercise = (): ExerciseRow => ({ exerciseId: '', exerciseName: '', targetSets: '3', targetRepsMin: '8', targetRepsMax: '12', targetRir: '', restSeconds: '90', notes: '' })
const blankDay = (index: number): DayRow => ({ name: `روز ${index + 1}`, exercises: [blankExercise()] })
const asNum = (v: string) => v.trim() === '' ? undefined : Number(v)
const toPayload = (f: { title: string; description: string; visibility: PlanVisibility; durationType: PlanDurationType; totalSessions: string; durationWeeks: string; goal: PlanGoal; level: PlanLevel; days: DayRow[] }): PlanWriteRequest => ({
  title: f.title.trim(), description: f.description.trim() || null, visibility: f.visibility, durationType: f.durationType,
  ...(f.durationType === 'Sessions' ? { totalSessions: asNum(f.totalSessions) } : { durationWeeks: asNum(f.durationWeeks) }),
  goal: f.goal, level: f.level,
  days: f.days.map((d) => ({ name: d.name.trim(), exercises: d.exercises.filter((e) => e.exerciseId.trim()).map((e, i) => ({
    exerciseId: e.exerciseId.trim(), orderIndex: i,
    ...(asNum(e.targetSets) !== undefined ? { targetSets: asNum(e.targetSets) } : {}),
    ...(asNum(e.targetRepsMin) !== undefined ? { targetRepsMin: asNum(e.targetRepsMin) } : {}),
    ...(asNum(e.targetRepsMax) !== undefined ? { targetRepsMax: asNum(e.targetRepsMax) } : {}),
    ...(asNum(e.targetRir) !== undefined ? { targetRir: asNum(e.targetRir) } : {}),
    ...(asNum(e.restSeconds) !== undefined ? { restSeconds: asNum(e.restSeconds) } : {}),
    notes: e.notes.trim() || null,
  })) })),
})

export function PlanFormDialog({ open, plan, onOpenChange, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<PlanVisibility>('Private')
  const [durationType, setDurationType] = useState<PlanDurationType>('Sessions')
  const [totalSessions, setTotalSessions] = useState('12')
  const [durationWeeks, setDurationWeeks] = useState('4')
  const [goal, setGoal] = useState<PlanGoal>('BuildMuscle')
  const [level, setLevel] = useState<PlanLevel>('Beginner')
  const [days, setDays] = useState<DayRow[]>([blankDay(0)])

  useEffect(() => {
    if (!open) return
    let active = true
    const load = async () => {
      if (!plan) {
        setTitle(''); setDescription(''); setVisibility('Private'); setDurationType('Sessions')
        setTotalSessions('12'); setDurationWeeks('4'); setGoal('BuildMuscle'); setLevel('Beginner'); setDays([blankDay(0)])
        return
      }
      setLoading(true)
      try {
        const d: PlanDetail = await getPlan(plan.id)
        if (!active) return
        setTitle(d.title); setDescription(d.description ?? ''); setVisibility(d.visibility); setDurationType(d.durationType)
        setTotalSessions(String(d.totalSessions ?? 12)); setDurationWeeks(String(d.durationWeeks ?? 4)); setGoal(d.goal); setLevel(d.level)
        setDays(d.days.length ? d.days.map((day) => ({ name: day.name, exercises: day.exercises.length ? day.exercises.map((e) => ({
          exerciseId: e.exerciseId, exerciseName: e.exerciseName ?? '', targetSets: String(e.targetSets ?? ''), targetRepsMin: String(e.targetRepsMin ?? ''),
          targetRepsMax: String(e.targetRepsMax ?? ''), targetRir: String(e.targetRir ?? ''), restSeconds: String(e.restSeconds ?? 90), notes: e.notes ?? '',
        })) : [blankExercise()] })) : [blankDay(0)])
      } catch (e) {
        toast.error('دریافت جزئیات برنامه ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' })
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [open, plan])

  const updateDay = (index: number, patch: Partial<DayRow>) => setDays((old) => old.map((d, i) => i === index ? { ...d, ...patch } : d))
  const updateExercise = (dayIndex: number, exerciseIndex: number, patch: Partial<ExerciseRow>) => setDays((old) => old.map((d, i) => i === dayIndex ? { ...d, exercises: d.exercises.map((e, j) => j === exerciseIndex ? { ...e, ...patch } : e) } : d))

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return toast.error('عنوان برنامه الزامی است')
    if (!days.length || days.some((d) => !d.name.trim())) return toast.error('نام تمام روزهای برنامه الزامی است')
    setSaving(true)
    try {
      const payload = toPayload({ title, description, visibility, durationType, totalSessions, durationWeeks, goal, level, days })
      if (plan) await updatePlan(plan.id, payload); else await createPlan(payload)
      toast.success(plan ? 'برنامه به‌روزرسانی شد' : 'برنامه ایجاد شد')
      onOpenChange(false); onSaved()
    } catch (e) { toast.error('ذخیره برنامه ناموفق بود', { description: e instanceof Error ? e.message : 'لطفاً ورودی‌ها را بررسی کنید.' }) }
    finally { setSaving(false) }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" dir="rtl">
      <DialogHeader><DialogTitle>{plan ? 'ویرایش برنامه تمرینی' : 'ایجاد برنامه تمرینی'}</DialogTitle></DialogHeader>
      {loading ? <div className="py-8 text-center">در حال دریافت جزئیات…</div> : <form className="space-y-4" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm"><span>عنوان *</span><Input value={title} onChange={e => setTitle(e.target.value)} required /></label>
          <label className="space-y-1 text-sm"><span>دسترسی</span><select className="h-10 rounded-md border bg-background px-3" value={visibility} onChange={e => setVisibility(e.target.value as PlanVisibility)}><option value="Private">خصوصی</option><option value="Public">عمومی</option></select></label>
          <label className="space-y-1 text-sm sm:col-span-2"><span>توضیحات</span><Input value={description} onChange={e => setDescription(e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span>هدف</span><select className="h-10 w-full rounded-md border bg-background px-3" value={goal} onChange={e => setGoal(e.target.value as PlanGoal)}>{[['GetStronger','افزایش قدرت'],['BuildMuscle','عضله‌سازی'],['LoseWeight','کاهش وزن'],['Endurance','استقامت'],['Fitness','تناسب اندام'],['Mobility','تحرک']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span>سطح</span><select className="h-10 w-full rounded-md border bg-background px-3" value={level} onChange={e => setLevel(e.target.value as PlanLevel)}>{[['Beginner','مبتدی'],['Intermediate','متوسط'],['Advanced','پیشرفته']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span>نوع مدت</span><select className="h-10 w-full rounded-md border bg-background px-3" value={durationType} onChange={e => setDurationType(e.target.value as PlanDurationType)}><option value="Sessions">جلسه</option><option value="Weeks">هفته</option></select></label>
          {durationType === 'Sessions' ? <label className="space-y-1 text-sm"><span>تعداد جلسات</span><Input type="number" min="1" value={totalSessions} onChange={e => setTotalSessions(e.target.value)} required /></label> : <label className="space-y-1 text-sm"><span>تعداد هفته</span><Input type="number" min="1" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)} required /></label>}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">روزها و حرکات</h3><Button type="button" variant="outline" size="sm" onClick={() => setDays(old => [...old, blankDay(old.length)])}><Plus className="ml-1 size-4" />افزودن روز</Button></div>
          {days.map((day, di) => <div key={di} className="space-y-3 rounded-lg border p-3">
            <div className="flex gap-2"><Input value={day.name} onChange={e => updateDay(di, { name: e.target.value })} placeholder="نام روز" /><Button type="button" variant="ghost" size="icon" disabled={days.length === 1} onClick={() => setDays(old => old.filter((_, i) => i !== di))}><Trash2 className="size-4 text-destructive" /></Button></div>
            {day.exercises.map((ex, ei) => <div key={ei} className="grid gap-2 rounded-md bg-muted/30 p-2 sm:grid-cols-3">
              <div className="space-y-1 text-xs sm:col-span-3">
                <span>حرکت</span>
                <ExercisePicker
                  value={ex.exerciseId || null}
                  valueLabel={ex.exerciseName || null}
                  onSelect={(sel: ExercisePickerSelection | null) =>
                    updateExercise(di, ei, { exerciseId: sel?.id ?? '', exerciseName: sel?.name ?? '' })
                  }
                />
              </div>
              <label className="space-y-1 text-xs"><span>ست هدف</span><Input type="number" min="1" value={ex.targetSets} onChange={e => updateExercise(di, ei, { targetSets: e.target.value })} /></label>
              <label className="space-y-1 text-xs"><span>حداقل تکرار</span><Input type="number" min="1" value={ex.targetRepsMin} onChange={e => updateExercise(di, ei, { targetRepsMin: e.target.value })} /></label>
              <label className="space-y-1 text-xs"><span>حداکثر تکرار</span><Input type="number" min="1" value={ex.targetRepsMax} onChange={e => updateExercise(di, ei, { targetRepsMax: e.target.value })} /></label>
              <label className="space-y-1 text-xs"><span>RIR هدف</span><Input type="number" min="0" value={ex.targetRir} onChange={e => updateExercise(di, ei, { targetRir: e.target.value })} /></label>
              <label className="space-y-1 text-xs"><span>استراحت (ثانیه)</span><Input type="number" min="0" value={ex.restSeconds} onChange={e => updateExercise(di, ei, { restSeconds: e.target.value })} /></label>
              <label className="space-y-1 text-xs"><span>یادداشت</span><Input value={ex.notes} onChange={e => updateExercise(di, ei, { notes: e.target.value })} /></label>
              <div className="sm:col-span-3"><Button type="button" variant="outline" size="sm" onClick={() => updateDay(di, { exercises: [...day.exercises, blankExercise()] })}><Plus className="ml-1 size-3" />افزودن حرکت</Button><Button type="button" variant="ghost" size="sm" onClick={() => updateDay(di, { exercises: day.exercises.filter((_, i) => i !== ei) })} disabled={day.exercises.length === 1}><Trash2 className="ml-1 size-3" />حذف حرکت</Button></div>
            </div>)}
          </div>)}
        </div>
        <DialogFooter><Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره برنامه'}</Button><Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}><X className="ml-1 size-4" />انصراف</Button></DialogFooter>
      </form>}
    </DialogContent>
  </Dialog>
}
