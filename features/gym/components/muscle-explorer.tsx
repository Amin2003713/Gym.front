'use client'

import {Activity, Dumbbell, Search, X} from 'lucide-react'
import {useSession} from 'next-auth/react'
import {useEffect, useMemo, useState} from 'react'

import {exerciseApi, exerciseCoverUrl} from '@/app/(tenant)/exercises/_api/exercise-api'
import type {ExerciseListItem} from '@/app/(tenant)/exercises/_model/exercise.types'
import {usersApi} from '@/features/users/api/users-api'


import BodyMap, {BodyMapLegend} from './body-map'


const muscles = [
    {id: 'trapezius', name: 'ذوزنقه‌ای', bodyPart: ['trapezius', 'traps', 'ذوزنقه']},
    {id: 'shoulders', name: 'سرشانه', bodyPart: ['shoulder', 'deltoid', 'سرشانه']},
    {id: 'chest', name: 'سینه', bodyPart: ['chest', 'pectorals', 'سینه']},
    {id: 'upper-back', name: 'پشت فوقانی', bodyPart: ['upper back', 'upper-back', 'lats', 'back', 'پشت']},
    {id: 'serratus', name: 'دندانه‌ای', bodyPart: ['serratus', 'دندانه‌ای']},
    {id: 'biceps', name: 'جلو بازو', bodyPart: ['biceps', 'upper arms', 'جلو بازو', 'بازو']},
    {id: 'triceps', name: 'پشت بازو', bodyPart: ['triceps', 'upper arms', 'پشت بازو', 'بازو']},
    {id: 'forearm', name: 'ساعد', bodyPart: ['forearm', 'lower arms', 'ساعد']},
    {id: 'abs', name: 'شکم', bodyPart: ['abs', 'abdominals', 'waist', 'شکم']},
    {id: 'obliques', name: 'مورب شکمی', bodyPart: ['obliques', 'مورب']},
    {id: 'lower-back', name: 'کمر', bodyPart: ['lower back', 'erector spinae', 'کمر']},
    {id: 'glutes', name: 'باسن', bodyPart: ['glutes', 'gluteal', 'باسن']},
    {id: 'quadriceps', name: 'چهارسر ران', bodyPart: ['quadriceps', 'quads', 'upper legs', 'thighs', 'ران']},
    {id: 'hamstrings', name: 'همسترینگ', bodyPart: ['hamstrings', 'upper legs', 'thighs', 'ران']},
    {id: 'adductors', name: 'داخل ران', bodyPart: ['adductors', 'inner thighs', 'داخل ران']},
    {id: 'hip-flexors', name: 'خم‌کننده لگن', bodyPart: ['hip flexors', 'hip-flexors', 'خم‌کننده لگن']},
    {id: 'calves', name: 'ساق پا', bodyPart: ['calves', 'lower legs', 'ساق']},
    {id: 'tibialis', name: 'جلوی ساق', bodyPart: ['tibialis', 'shins', 'جلوی ساق']},
]

const field = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
const fa = (n: number) => n.toLocaleString('fa-IR')
const contains = (value: string | null | undefined, query: string) =>
    String(value ?? '').toLocaleLowerCase().includes(query.toLocaleLowerCase())

type FigureGender = 'male' | 'female'
type Muscle = (typeof muscles)[number]

function normalizeGender(value: unknown): FigureGender | null {
    if (value === 0 || value === '0') return 'male'
    if (value === 1 || value === '1') return 'female'
    const normalized = String(value ?? '').trim().toLowerCase()
    if (['male', 'man', 'm', 'مرد', 'آقا'].includes(normalized)) return 'male'
    if (['female', 'woman', 'f', 'زن', 'خانم'].includes(normalized)) return 'female'
    return null
}

function genderFromToken(token: unknown): FigureGender | null {
    if (typeof token !== 'string') return null
    try {
        const payload = token.split('.')[1]
        if (!payload) return null
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
        const claims = JSON.parse(decoded) as Record<string, unknown>
        const profile = claims.profile && typeof claims.profile === 'object' ? claims.profile as Record<string, unknown> : {}
        for (const key of ['gender', 'Gender', 'sex', 'Sex']) {
            const gender = normalizeGender(claims[key] ?? profile[key])
            if (gender) return gender
        }
    } catch { /* Opaque/non-JWT tokens are expected; profile lookup remains available. */
    }
    return null
}

// Does an exercise belong to a given muscle?
function matchesMuscle(ex: ExerciseListItem, m: Muscle) {
    const target = `${ex.target ?? ''} ${ex.bodyPart ?? ''} ${ex.category ?? ''}`
    return m.bodyPart.some(alias => contains(target, alias)) || contains(ex.target, m.name)
}

export function MuscleExplorer() {
    const {data: session} = useSession()
    const sessionUser = session?.user as {
        gender?: number | string | null;
        accessToken?: string;
        id?: string
    } | undefined
    const [figureGender, setFigureGender] = useState<FigureGender>(
        () => genderFromToken(sessionUser?.accessToken) ?? normalizeGender(sessionUser?.gender) ?? 'male'
    )
    const [items, setItems] = useState<ExerciseListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [apiError, setApiError] = useState(false)
    const [selected, setSelected] = useState('chest')
    const [query, setQuery] = useState('')
    const [bodyPart, setBodyPart] = useState('')
    const [equipment, setEquipment] = useState('')
    const [selectedExercise, setSelectedExercise] = useState<ExerciseListItem | null>(null)

    useEffect(() => {
        let alive = true
        const tokenGender = genderFromToken(sessionUser?.accessToken)
        const sessionGender = normalizeGender(sessionUser?.gender)
        if (tokenGender ?? sessionGender) setFigureGender((tokenGender ?? sessionGender)!)

        // The profile is authoritative when the JWT does not expose gender (or is stale).
        if (sessionUser?.id) {
            usersApi.info(sessionUser.id)
                .then(profile => {
                    if (!alive) return
                    const profileGender = normalizeGender(profile?.gender)
                    if (profileGender) setFigureGender(profileGender)
                })
                .catch(() => { /* Keep the gender resolved from session/JWT, if present. */
                })
        }
        return () => {
            alive = false
        }
    }, [sessionUser?.id, sessionUser?.gender, sessionUser?.accessToken])

    useEffect(() => {
        let alive = true
        exerciseApi.list({pageNumber: 1, pageSize: 100, languageCode: 'fa'})
            .then(result => {
                if (alive) setItems(result.results ?? [])
            })
            .catch(() => {
                if (alive) setApiError(true)
            })
            .finally(() => {
                if (alive) setLoading(false)
            })
        return () => {
            alive = false
        }
    }, [])

    const select = (id: string) => {
        setSelected(id)
        setBodyPart('')
        setEquipment('')
    }

    const chosenMuscle = muscles.find(m => m.id === selected) ?? muscles[0]

    const muscleMatches = useMemo(
        () => items.filter(ex => matchesMuscle(ex, chosenMuscle)),
        [items, chosenMuscle]
    )

    // Shades the body map: number of exercises the library has per muscle.
    const load = useMemo(() => {
        const out: Record<string, number> = {}
        for (const m of muscles) out[m.id] = items.filter(ex => matchesMuscle(ex, m)).length
        return out
    }, [items])

    const equipmentOptions = useMemo(
        () => Array.from(new Set(muscleMatches.map(x => x.equipment).filter((x): x is string => Boolean(x)))).sort(),
        [muscleMatches]
    )

    const bodyPartOptions = useMemo(
        () => Array.from(new Set(muscleMatches.map(x => x.bodyPart).filter((x): x is string => Boolean(x)))).sort(),
        [muscleMatches]
    )

    const visible = useMemo(() => muscleMatches.filter(ex =>
        (!query || `${ex.name} ${ex.description ?? ''} ${ex.target ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) &&
        (!bodyPart || ex.bodyPart === bodyPart) &&
        (!equipment || ex.equipment === equipment)
    ), [muscleMatches, query, bodyPart, equipment])

    return (
        <section className="space-y-4" dir="rtl">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Activity
                        className="size-4"/> کاوش عضلات
                    </div>
                    <h2 className="mt-1 text-xl font-extrabold">حرکات بر اساس عضله</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">روی ناحیه بدن یا نام عضله بزنید تا حرکات
                        مرتبط را فیلتر کنید.</p>
                </div>
                <span
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">{fa(visible.length)} حرکت</span>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(280px,.8fr)_minmax(0,1.2fr)]">
                {/* Body map */}
                <div className="rounded-2xl border bg-card p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold">نقشه عضلات</h3>
                        <span className="text-xs text-muted-foreground">
              {figureGender === 'female' ? 'نمای زنانه · بر اساس پروفایل' : 'نمای مردانه · بر اساس پروفایل یا پیش‌فرض'}
            </span>
                    </div>

                    <BodyMap body={figureGender} selected={selected} load={load} onMuscle={select}/>
                    <div className="mt-2 flex justify-end"><BodyMapLegend/></div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {muscles.map(m => (
                            <button
                                key={m.id}
                                onClick={() => select(m.id)}
                                className={`rounded-full border px-3 py-1.5 text-xs transition ${selected === m.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50 hover:bg-primary/5'}`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Exercise list */}
                <div className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-lg font-bold">حرکات {chosenMuscle.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">فهرست از کتابخانه حرکات HamOwj بارگیری
                                می‌شود.</p>
                        </div>
                        <span
                            className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{fa(visible.length)} نتیجه</span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_150px]">
                        <label className="relative block">
                            <Search className="absolute right-3 top-3 size-4 text-muted-foreground"/>
                            <input className={`${field} pr-9`} value={query} onChange={e => setQuery(e.target.value)}
                                   placeholder="جست‌وجوی نام حرکت..."/>
                        </label>
                        <select className={field} value={bodyPart} onChange={e => setBodyPart(e.target.value)}>
                            <option value="">همه نواحی بدن</option>
                            {bodyPartOptions.map(x => <option key={x}>{x}</option>)}
                        </select>
                        <select className={field} value={equipment} onChange={e => setEquipment(e.target.value)}>
                            <option value="">همه تجهیزات</option>
                            {equipmentOptions.map(x => <option key={x}>{x}</option>)}
                        </select>
                    </div>

                    {(query || bodyPart || equipment) && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setBodyPart('');
                                setEquipment('')
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-3.5"/> پاک‌کردن فیلترها
                        </button>
                    )}

                    <div className="mt-4 space-y-2">
                        {loading ? (
                            <div className="flex min-h-36 items-center justify-center text-sm text-muted-foreground">در
                                حال بارگیری کتابخانه حرکات…</div>
                        ) : visible.length ? (
                            visible.slice(0, 40).map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => setSelectedExercise(ex)}
                                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-right transition hover:border-primary/40 hover:bg-primary/5"
                                >
                                    <div
                                        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                                        {exerciseCoverUrl(ex.cover)
                                            ? <img src={exerciseCoverUrl(ex.cover)} alt=""
                                                   className="size-full object-cover"/>
                                            : <Dumbbell className="size-5 text-muted-foreground"/>}
                                    </div>
                                    <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{ex.name}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {[ex.target, ex.bodyPart, ex.equipment].filter(Boolean).join(' · ') || 'جزئیات تکمیلی ثبت نشده'}
                    </span>
                  </span>
                                    <span className="text-xs text-primary">جزئیات</span>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                                <Dumbbell className="mx-auto size-7 text-muted-foreground"/>
                                <p className="mt-2 font-semibold">حرکتی پیدا نشد</p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">عضله یا فیلتر دیگری را
                                    امتحان کنید.</p>
                            </div>
                        )}

                        {apiError && (
                            <p className="rounded-lg bg-warning/10 p-3 text-xs leading-5 text-muted-foreground">
                                کتابخانه از API در دسترس نیست؛ این بخش از داده ساختگی استفاده نمی‌کند. پس از اتصال سرویس
                                حرکات، نتایج اینجا نمایش داده می‌شوند.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Exercise details dialog */}
            {selectedExercise && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) setSelectedExercise(null)
                    }}
                >
                    <section role="dialog" aria-modal="true"
                             className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-card p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-extrabold">{selectedExercise.name}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {[selectedExercise.category, selectedExercise.bodyPart, selectedExercise.target, selectedExercise.equipment].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            <button onClick={() => setSelectedExercise(null)} aria-label="بستن"
                                    className="rounded-lg p-2 hover:bg-muted">
                                <X className="size-5"/>
                            </button>
                        </div>
                        {selectedExercise.description &&
                            <p className="mt-4 text-sm leading-7">{selectedExercise.description}</p>}
                        <div className="mt-5 flex justify-end">
                            <button onClick={() => setSelectedExercise(null)}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">بستن
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    )
}