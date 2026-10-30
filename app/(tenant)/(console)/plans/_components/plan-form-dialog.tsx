'use client'

import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import { createPlan, getPlan, updatePlan } from '../_api/plan-api'
import type { PlanDetail, PlanDurationType, PlanGoal, PlanLevel, PlanSummary, PlanVisibility, PlanWriteRequest } from '../_model/plan.types'

import ExercisePicker, { type ExercisePickerSelection } from './exercise-picker'
import PlanCoverageMap from './plan-coverage-map'
import { useAppLocale } from '@/hooks/use-app-locale'

type Props = { open: boolean; plan?: PlanSummary | null; onOpenChange: (open: boolean) => void; onSaved: () => void }
type ExerciseRow = { exerciseId: string; exerciseName: string; targetSets: string; targetRepsMin: string; targetRepsMax: string; targetRir: string; restSeconds: string; notes: string }
type DayRow = { name: string; exercises: ExerciseRow[] }
const blankExercise = (): ExerciseRow => ({ exerciseId: '', exerciseName: '', targetSets: '3', targetRepsMin: '8', targetRepsMax: '12', targetRir: '', restSeconds: '90', notes: '' })
const blankDay = (index: number): DayRow => ({ name: `روز ${index + 1}`, exercises: [blankExercise()] })
const asNum = (v: string) => (v.trim() === '' ? undefined : Number(v))
const MAX_DAYS = 14

const GOALS: [PlanGoal, string][] = [
  ['GetStronger', 'افزایش قدرت'],
  ['BuildMuscle', 'عضله‌سازی'],
  ['LoseWeight', 'کاهش وزن'],
  ['Endurance', 'استقامت'],
  ['Fitness', 'تناسب اندام'],
  ['Mobility', 'تحرک'],
]
const LEVELS: [PlanLevel, string][] = [
  ['Beginner', 'مبتدی'],
  ['Intermediate', 'متوسط'],
  ['Advanced', 'پیشرفته'],
]

const toPayload = (f: {
  title: string
  description: string
  visibility: PlanVisibility
  durationType: PlanDurationType
  totalSessions: string
  durationWeeks: string
  goal: PlanGoal
  level: PlanLevel
  days: DayRow[]
}): PlanWriteRequest => ({
  title: f.title.trim(),
  description: f.description.trim() || null,
  visibility: f.visibility,
  durationType: f.durationType,
  ...(f.durationType === 'Sessions' ? { totalSessions: asNum(f.totalSessions) } : { durationWeeks: asNum(f.durationWeeks) }),
  goal: f.goal,
  level: f.level,
  days: f.days.map((d) => ({
    name: d.name.trim(),
    exercises: d.exercises.filter((e) => e.exerciseId.trim()).map((e, i) => ({
      exerciseId: e.exerciseId.trim(),
      orderIndex: i,
      ...(asNum(e.targetSets) !== undefined ? { targetSets: asNum(e.targetSets) } : {}),
      ...(asNum(e.targetRepsMin) !== undefined ? { targetRepsMin: asNum(e.targetRepsMin) } : {}),
      ...(asNum(e.targetRepsMax) !== undefined ? { targetRepsMax: asNum(e.targetRepsMax) } : {}),
      ...(asNum(e.targetRir) !== undefined ? { targetRir: asNum(e.targetRir) } : {}),
      ...(asNum(e.restSeconds) !== undefined ? { restSeconds: asNum(e.restSeconds) } : {}),
      notes: e.notes.trim() || null,
    })),
  })),
})

export function PlanFormDialog({ open, plan, onOpenChange, onSaved }: Props) {
  const locale = useAppLocale()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)

  // General details (user-entered).
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<PlanVisibility>('Private')
  const [durationType, setDurationType] = useState<PlanDurationType>('Sessions')
  const [totalSessions, setTotalSessions] = useState('12')
  const [durationWeeks, setDurationWeeks] = useState('4')
  const [goal, setGoal] = useState<PlanGoal>('BuildMuscle')
  const [level, setLevel] = useState<PlanLevel>('Beginner')

  // A separate day-count input: the stepper adds a step per training day.
  const [dayCount, setDayCount] = useState(1)
  const [days, setDays] = useState<DayRow[]>([blankDay(0)])

  const stepCount = 1 + days.length + 1 // details + one step per day + review

  useEffect(() => {
    if (!open) return
    let active = true
    setStep(0)
    const load = async () => {
      if (!plan) {
        setTitle(''); setDescription(''); setVisibility('Private'); setDurationType('Sessions')
        setTotalSessions('12'); setDurationWeeks('4'); setGoal('BuildMuscle'); setLevel('Beginner')
        setDayCount(1); setDays([blankDay(0)])
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
        setDayCount(Math.max(1, d.days.length))
      } catch (e) {
        toast.error('دریافت جزئیات برنامه ناموفق بود', { description: e instanceof Error ? e.message : 'خطای ناشناخته' })
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [open, plan])

  /** Keep the days list and the day-count input in sync: the count drives the
   *  number of stepper steps, existing edits are kept when the list shrinks. */
  const changeDayCount = (raw: string) => {
    const value = Math.max(1, Math.min(MAX_DAYS, Number(raw) || 1))
    setDayCount(value)
    setDays((old) => {
      if (value >= old.length) {
        const extra = Array.from({ length: value - old.length }, (_, i) =>
          blankDay(old.length + i),
        )
        return [...old, ...extra]
      }
      return old.slice(0, value)
    })
  }

  const updateDay = (index: number, patch: Partial<DayRow>) => setDays((old) => old.map((d, i) => i === index ? { ...d, ...patch } : d))
  const updateExercise = (dayIndex: number, exerciseIndex: number, patch: Partial<ExerciseRow>) => setDays((old) => old.map((d, i) => i === dayIndex ? { ...d, exercises: d.exercises.map((e, j) => j === exerciseIndex ? { ...e, ...patch } : e) } : d))

  /** Step-level validation before advancing. */
  const validateStep = (): string | null => {
    if (step === 0) {
      if (!title.trim()) return 'عنوان برنامه الزامی است'
      const duration = durationType === 'Sessions' ? asNum(totalSessions) : asNum(durationWeeks)
      if (!duration || duration < 1) return durationType === 'Sessions' ? 'تعداد جلسات معتبر وارد کنید' : 'تعداد هفته معتبر وارد کنید'
    }
    const dayIndex = step - 1
    if (step >= 1 && dayIndex < days.length) {
      const d = days[dayIndex]
      if (d) {
        if (!d.name.trim()) return `نام ${d.name} الزامی است`
        if (d.exercises.every((e) => !e.exerciseId.trim())) return 'حداقل یک حرکت برای این روز انتخاب کنید'
      }
    }
    return null
  }

  const goNext = () => {
    const problem = validateStep()
    if (problem) return void toast.error(problem)
    setStep((old) => Math.min(old + 1, stepCount - 1))
  }

  const submit = async () => {
    if (!title.trim()) return void toast.error('عنوان برنامه الزامی است')
    if (days.some((d) => !d.name.trim())) return void toast.error('نام تمام روزهای برنامه الزامی است')
    setSaving(true)
    try {
      const payload = toPayload({ title, description, visibility, durationType, totalSessions, durationWeeks, goal, level, days })
      if (plan) await updatePlan(plan.id, payload); else await createPlan(payload)
      toast.success(plan ? 'برنامه به‌روزرسانی شد' : 'برنامه ایجاد شد')
      onOpenChange(false); onSaved()
    } catch (e) { toast.error('ذخیره برنامه ناموفق بود', { description: e instanceof Error ? e.message : 'لطفاً ورودی‌ها را بررسی کنید.' }) }
    finally { setSaving(false) }
  }

  const labels = ['اطلاعات کلی', ...days.map((d, i) => d.name.trim() || `روز ${i + 1}`), 'بازبینی و ذخیره']

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" dir="rtl">
      <DialogHeader><DialogTitle>{plan ? 'ویرایش برنامه تمرینی' : 'ایجاد برنامه تمرینی'}</DialogTitle></DialogHeader>
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">در حال دریافت جزئیات…</div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); void submit() }}
        >
          {/* Progress chip row — one chip per step, days stay in order. */}
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="مراحل برنامه">
            {labels.map((label, i) => (
              <button
                key={`${label}-${i}`}
                type="button"
                role="tab"
                aria-selected={step === i}
                onClick={() => i <= step && setStep(i)}
                className={
                  i === step
                    ? 'bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-semibold'
                    : i < step
                      ? 'hover:bg-muted rounded-full border px-3 py-1.5 text-xs font-semibold text-foreground'
                      : 'text-muted-foreground rounded-full border border-dashed px-3 py-1.5 text-xs'
                }
              >
                {i + 1}. {label}
              </button>
            ))}
          </div>

          {/* Step 0 — overall plan details, including the day-count that
              generates one extra step per day. */}
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm"><span>عنوان *</span><Input value={title} onChange={e => setTitle(e.target.value)} required /></label>
              <label className="space-y-1 text-sm"><span>دسترسی</span><select className="h-10 rounded-md border bg-background px-3" value={visibility} onChange={e => setVisibility(e.target.value as PlanVisibility)}><option value="Private">خصوصی</option><option value="Public">عمومی</option></select></label>
              <label className="space-y-1 text-sm sm:col-span-2"><span>توضیحات</span><Input value={description} onChange={e => setDescription(e.target.value)} /></label>
              <label className="space-y-1 text-sm"><span>هدف</span><select className="h-10 w-full rounded-md border bg-background px-3" value={goal} onChange={e => setGoal(e.target.value as PlanGoal)}>{GOALS.map(([v, l]) => <option key={v} value={v}>{locale === 'en' ? ({ GetStronger: 'Strength', BuildMuscle: 'Muscle gain', LoseWeight: 'Weight loss', Endurance: 'Endurance', Fitness: 'Fitness', Mobility: 'Mobility' } as const)[v] : l}</option>)}</select></label>
              <label className="space-y-1 text-sm"><span>سطح</span><select className="h-10 w-full rounded-md border bg-background px-3" value={level} onChange={e => setLevel(e.target.value as PlanLevel)}>{LEVELS.map(([v, l]) => <option key={v} value={v}>{locale === 'en' ? ({ Beginner: 'Beginner', Intermediate: 'Intermediate', Advanced: 'Advanced' } as const)[v] : l}</option>)}</select></label>
              <label className="space-y-1 text-sm"><span>نوع مدت</span><select className="h-10 rounded-md border bg-background px-3" value={durationType} onChange={e => setDurationType(e.target.value as PlanDurationType)}><option value="Sessions">جلسه</option><option value="Weeks">هفته</option></select></label>
              {durationType === 'Sessions' ? <label className="space-y-1 text-sm"><span>تعداد جلسات *</span><Input type="number" min="1" value={totalSessions} onChange={e => setTotalSessions(e.target.value)} required /></label> : <label className="space-y-1 text-sm"><span>تعداد هفته *</span><Input type="number" min="1" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)} required /></label>}
              <label className="space-y-1 text-sm sm:col-span-2"><span>تعداد روزهای تمرین در برنامه * (تا {MAX_DAYS} روز)</span><Input type="number" min="1" max={MAX_DAYS} value={dayCount} onChange={e => changeDayCount(e.target.value)} /></label>
              <p className="text-muted-foreground leading-5 text-xs sm:col-span-2">
                با وارد کردن تعداد روز، برای هر روز یک مرحله در همین فرم ساخته می‌شود.
              </p>
            </div>
          )}

          {/* One step per training day */}
          {step >= 1 && step - 1 < days.length && (() => {
            const di = step - 1
            const day = days[di]
            return (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="space-y-1 text-sm"><span>نام روز *</span><Input value={day.name} onChange={e => updateDay(di, { name: e.target.value })} placeholder="مثلاً بالاتنه" /></label>
                  <div className="flex items-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => updateDay(di, { exercises: [...day.exercises, blankExercise()] })}><Plus className="ml-1 size-4" />حرکت جدید</Button>
                    {days.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = days.filter((_, i) => i !== di)
                          setDays(next)
                          setDayCount(next.length)
                          setStep((old) => Math.max(1, old - 1))
                        }}
                      ><Trash2 className="ml-1 size-4 text-destructive" />حذف روز</Button>
                    )}
                  </div>
                </div>
                {day.exercises.map((ex, ei) => (
                  <div key={ei} className="grid gap-2 rounded-md bg-muted/30 p-2 sm:grid-cols-3">
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
                    <label className="space-y-1 text-xs"><span>{locale === 'en' ? 'Rest interval' : 'استراحت (ثانیه)'}</span><select className="h-10 w-full rounded-md border bg-background px-3" value={ex.restSeconds} onChange={e => updateExercise(di, ei, { restSeconds: e.target.value })} aria-label="مدت استراحت بین ست‌ها">{[30,45,60,75,90,120,150,180,240,300].map(seconds => <option key={seconds} value={seconds}>{locale === 'en' ? `${seconds} sec` : `${seconds.toLocaleString('fa-IR')} ثانیه`}</option>)}</select></label>
                    <label className="space-y-1 text-xs"><span>یادداشت</span><Input value={ex.notes} onChange={e => updateExercise(di, ei, { notes: e.target.value })} /></label>
                    <div className="sm:col-span-3">
                      <Button type="button" variant="ghost" size="sm" disabled={day.exercises.length === 1} onClick={() => updateDay(di, { exercises: day.exercises.filter((_, i) => i !== ei) })}><Trash2 className="ml-1 size-3" />حذف حرکت</Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Review + save */}
          {step === stepCount - 1 && (
            <div className="space-y-3">
              <div className="grid gap-2 rounded-lg border p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">عنوان</span><strong>{title || '—'}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">هدف / سطح</span><span>{GOALS.find(([v]) => v === goal)?.[1]} · {LEVELS.find(([v]) => v === level)?.[1]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">مدت</span><span>{durationType === 'Sessions' ? `${totalSessions || '—'} جلسه` : `${durationWeeks || '—'} هفته`}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">روزها</span><span>{days.length}</span></div>
              </div>
              <PlanCoverageMap
                rows={days.flatMap((day) => day.exercises.map((ex) => ({
                  exerciseId: ex.exerciseId,
                  targetSets: Number(ex.targetSets) || undefined,
                })))}
              />
            </div>
          )}

          <DialogFooter>
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep((old) => Math.max(0, old - 1))}>
                <ChevronRight className="ml-1 size-4" />قبلی
              </Button>
            )}
            {step < stepCount - 1 ? (
              <Button type="button" onClick={goNext}>
                بعدی<ChevronLeft className="mr-1 size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره برنامه'}</Button>
            )}
            <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}><X className="ml-1 size-4" />انصراف</Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  </Dialog>
}
