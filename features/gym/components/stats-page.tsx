'use client'

import {Activity, Award, CalendarDays, Dumbbell, Flame, Info, Target, TrendingUp, Weight} from 'lucide-react'
import {useMemo, useState, type ReactNode} from 'react'
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

import {MuscleExplorer} from './muscle-explorer'

const fa = (n: number) => n.toLocaleString('fa-IR')

const tabs = [
    {id: 'overview', label: 'نمای کلی', icon: Activity},
    {id: 'strength', label: 'قدرت و رکوردها', icon: Award},
    {id: 'muscles', label: 'تعادل عضلات', icon: Dumbbell},
    {id: 'bodyweight', label: 'وزن بدن', icon: Weight},
]

const workouts = [
    {date: '2026-10-25', title: 'بالاتنه A', minutes: 52, sets: 18, volume: 4820},
    {date: '2026-10-23', title: 'پایین‌تنه', minutes: 61, sets: 21, volume: 7210},
    {date: '2026-10-21', title: 'بالاتنه B', minutes: 47, sets: 17, volume: 4510},
    {date: '2026-10-19', title: 'فول‌بادی', minutes: 56, sets: 20, volume: 6320},
    {date: '2026-10-17', title: 'پایین‌تنه', minutes: 58, sets: 20, volume: 6840},
    {date: '2026-10-15', title: 'بالاتنه A', minutes: 50, sets: 18, volume: 4630},
]

const strengthSeries = [
    {date: '۲۹ شهریور', bench: 52.5, squat: 75, deadlift: 90},
    {date: '۵ مهر', bench: 55, squat: 77.5, deadlift: 92.5},
    {date: '۱۲ مهر', bench: 55, squat: 80, deadlift: 95},
    {date: '۱۹ مهر', bench: 57.5, squat: 80, deadlift: 97.5},
    {date: '۲۶ مهر', bench: 60, squat: 82.5, deadlift: 100},
]

const weightSeries = [
    {date: '۱ مهر', weight: 78.2}, {date: '۴ مهر', weight: 78.0}, {date: '۷ مهر', weight: 77.9},
    {date: '۱۰ مهر', weight: 77.7}, {date: '۱۳ مهر', weight: 77.8}, {date: '۱۶ مهر', weight: 77.5},
    {date: '۱۹ مهر', weight: 77.4}, {date: '۲۲ مهر', weight: 77.2}, {date: '۲۵ مهر', weight: 77.1},
]

const prs = [
    {exercise: 'پرس سینه هالتر', current: '۶۰ kg', previous: '۵۷٫۵ kg', change: '+۲٫۵ kg', date: '۲۶ مهر'},
    {exercise: 'اسکوات هالتر', current: '۸۲٫۵ kg', previous: '۸۰ kg', change: '+۲٫۵ kg', date: '۲۶ مهر'},
    {exercise: 'ددلیفت', current: '۱۰۰ kg', previous: '۹۷٫۵ kg', change: '+۲٫۵ kg', date: '۲۶ مهر'},
    {exercise: 'پرس سرشانه دمبل', current: '۲۰ kg', previous: '۱۸ kg', change: '+۲ kg', date: '۲۲ مهر'},
]

// `slugs` = which body-map muscles (ids from lib/muscles) each row covers.
const muscleRows = [
    {name: 'سینه', sets: 14, pct: 88, slugs: ['chest']},
    {name: 'پشت', sets: 12, pct: 76, slugs: ['upper-back', 'lower-back']},
    {name: 'چهارسر ران', sets: 10, pct: 63, slugs: ['quadriceps']},
    {name: 'سرشانه', sets: 9, pct: 57, slugs: ['shoulders']},
    {name: 'همسترینگ', sets: 7, pct: 44, slugs: ['hamstrings']},
    {name: 'بازو', sets: 6, pct: 38, slugs: ['biceps', 'triceps']},
]

// sets per map slug, derived once from the rows above
const muscleLoad: Record<string, number> = Object.fromEntries(
    muscleRows.flatMap(r => r.slugs.map(slug => [slug, r.sets]))
)

const tooltipStyle = {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--popover-foreground)',
    boxShadow: '0 12px 32px rgb(0 0 0 / 12%)',
    fontSize: 12,
}

const RangeSelect = ({value, onChange}: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
            className="h-9 rounded-lg border bg-background px-2 text-xs">
        <option>۷ روز</option>
        <option>۳۰ روز</option>
        <option>۹۰ روز</option>
        <option>همه</option>
    </select>
)

function Panel({title, description, action, children}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode
}) {
    return (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
                <div>
                    <h2 className="font-bold">{title}</h2>
                    {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
                </div>
                {action}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    )
}

function Metric({title, value, detail, icon: Icon, positive = false}: {
    title: string;
    value: string;
    detail: string;
    icon: typeof Activity;
    positive?: boolean
}) {
    return (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground"><Icon
                    className="size-5"/></span>
            </div>
            <p className={`mt-3 text-xs ${positive ? 'text-success' : 'text-muted-foreground'}`}>{detail}</p>
        </div>
    )
}

function ChartNotice() {
    return (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-warning"/>
            این صفحه فعلاً از داده نمونه برای نمایش تجربه آمار استفاده می‌کند. اعداد، رکوردها و تاریخچه واقعی حساب
            نیستند.
        </p>
    )
}

function ActivityHeatmap() {
    const cells = useMemo(() => Array.from({length: 364}, (_, i) => {
        const wave = (i * 17 + Math.floor(i / 7) * 11) % 13
        return {id: i, level: wave < 5 ? 0 : wave < 8 ? 1 : wave < 11 ? 2 : wave < 12 ? 3 : 4}
    }), [])
    const shades = ['bg-muted', 'bg-primary/15', 'bg-primary/35', 'bg-primary/60', 'bg-primary']
    return (
        <div>
            <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
                {cells.map(c => <span key={c.id} title={`فعالیت نمونه · سطح ${c.level}`}
                                      className={`size-3 rounded-[3px] ${shades[c.level]}`}/>)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>یک سال گذشته</span>
                <span className="flex items-center gap-1.5">
          کم {shades.map(s => <i key={s} className={`size-3 rounded-[3px] ${s}`}/>)} زیاد
        </span>
            </div>
        </div>
    )
}

function Overview() {
    const [period, setPeriod] = useState('۳۰ روز')
    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric title="جلسه‌های تمرین" value={fa(18)} detail="۴ جلسه بیشتر از دوره قبل" icon={Dumbbell}
                        positive/>
                <Metric title="زمان تمرین" value="۱۴ ساعت" detail="میانگین ۴۷ دقیقه برای هر جلسه" icon={CalendarDays}/>
                <Metric title="ست‌های انجام‌شده" value={fa(286)} detail="میانگین ۱۵٫۹ ست در جلسه" icon={Target}/>
                <Metric title="رکوردهای شخصی" value={fa(8)} detail="۳ رکورد جدید در این ماه" icon={Award} positive/>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
                <Panel title="حجم تمرین" description="مجموع وزنه × تکرار در جلسات اخیر"
                       action={<RangeSelect value={period} onChange={setPeriod}/>}>
                    <div className="h-60 min-w-0 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={workouts.slice().reverse()}
                                       margin={{top: 10, right: 8, left: -15, bottom: 0}}>
                                <defs>
                                    <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.32}/>
                                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false}/>
                                <XAxis dataKey="date" tickLine={false} axisLine={false}
                                       tick={{fontSize: 10, fill: 'var(--muted-foreground)'}} tickMargin={10}/>
                                <YAxis tickLine={false} axisLine={false}
                                       tick={{fontSize: 10, fill: 'var(--muted-foreground)'}} tickMargin={8}/>
                                <Tooltip contentStyle={tooltipStyle} labelStyle={{
                                    color: 'var(--popover-foreground)',
                                    fontWeight: 700,
                                    marginBottom: 6
                                }} itemStyle={{color: 'var(--primary)'}} cursor={{
                                    stroke: 'var(--primary)',
                                    strokeDasharray: '4 4',
                                    strokeOpacity: 0.55
                                }}/>
                                <Area type="monotone" dataKey="volume" name="حجم تمرین" stroke="var(--chart-1)"
                                      fill="url(#volumeFill)" strokeWidth={2.75}
                                      dot={{r: 3, fill: 'var(--card)', stroke: 'var(--chart-1)', strokeWidth: 2}}
                                      activeDot={{
                                          r: 5,
                                          fill: 'var(--chart-1)',
                                          stroke: 'var(--card)',
                                          strokeWidth: 2
                                      }}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartNotice/>
                </Panel>

                <Panel title="پیوستگی تمرین" description="نقشه فعالیت یک سال اخیر">
                    <ActivityHeatmap/>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                        <div><p className="text-xl font-extrabold">۶</p><p
                            className="mt-1 text-xs text-muted-foreground">روز پیوسته</p></div>
                        <div><p className="text-xl font-extrabold">۳</p><p
                            className="mt-1 text-xs text-muted-foreground">جلسه این هفته</p></div>
                        <div><p className="text-xl font-extrabold">۷۸٪</p><p
                            className="mt-1 text-xs text-muted-foreground">هدف هفتگی</p></div>
                    </div>
                </Panel>
            </div>

            <Panel title="جلسات اخیر" description="مرور کوتاه آخرین تمرین‌های ثبت‌شده در نمونه">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-right text-sm">
                        <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                            <th className="pb-3 font-medium">جلسه</th>
                            <th className="pb-3 font-medium">تاریخ</th>
                            <th className="pb-3 font-medium">مدت</th>
                            <th className="pb-3 font-medium">ست</th>
                            <th className="pb-3 font-medium">حجم</th>
                        </tr>
                        </thead>
                        <tbody>
                        {workouts.slice(0, 5).map(w => (
                            <tr key={w.date} className="border-b last:border-0">
                                <td className="py-3.5 font-semibold">{w.title}</td>
                                <td className="py-3.5 text-muted-foreground">{new Date(w.date + 'T12:00:00').toLocaleDateString('fa-IR')}</td>
                                <td className="py-3.5">{fa(w.minutes)} دقیقه</td>
                                <td className="py-3.5">{fa(w.sets)}</td>
                                <td className="py-3.5">{fa(w.volume)} kg</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <ChartNotice/>
            </Panel>
        </div>
    )
}

function Strength() {
    const [exercise, setExercise] = useState<'bench' | 'squat' | 'deadlift'>('bench')
    const labels = {bench: 'پرس سینه', squat: 'اسکوات', deadlift: 'ددلیفت'}
    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric title="بهترین 1RM تخمینی" value="۱۰۰ kg" detail="ددلیفت · رکورد نمونه" icon={TrendingUp}
                        positive/>
                <Metric title="پرس سینه" value="۶۰ kg" detail="+۲٫۵ کیلو در ۳۰ روز" icon={Dumbbell} positive/>
                <Metric title="اسکوات" value="۸۲٫۵ kg" detail="+۵ کیلو در ۳۰ روز" icon={Target} positive/>
                <Metric title="نرخ پیشرفت" value="۸٫۴٪" detail="بر اساس داده نمایشی" icon={Flame}/>
            </div>

            <Panel
                title="روند قدرت"
                description="روند رکورد تخمینی در تمرین‌های اخیر"
                action={
                    <select className="h-9 rounded-lg border bg-background px-2 text-xs" value={exercise}
                            onChange={e => setExercise(e.target.value as typeof exercise)}>
                        {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                }
            >
                <div className="h-64 min-w-0 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={strengthSeries} margin={{top: 12, right: 8, left: -15, bottom: 0}}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false}/>
                            <XAxis dataKey="date" tickLine={false} axisLine={false}
                                   tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} tickMargin={10}/>
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} tickLine={false} axisLine={false}
                                   tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} tickMargin={8}/>
                            <Tooltip contentStyle={tooltipStyle}
                                     labelStyle={{color: 'var(--popover-foreground)', fontWeight: 700, marginBottom: 6}}
                                     itemStyle={{color: 'var(--primary)'}}
                                     cursor={{stroke: 'var(--primary)', strokeDasharray: '4 4', strokeOpacity: 0.55}}/>
                            <Area type="monotone" dataKey={exercise} name={labels[exercise]} stroke="var(--chart-1)"
                                  fill="var(--chart-1)" fillOpacity={0.13} strokeWidth={2.75}
                                  dot={{r: 3, fill: 'var(--card)', stroke: 'var(--chart-1)', strokeWidth: 2}}
                                  activeDot={{r: 5, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2}}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <ChartNotice/>
            </Panel>

            <Panel title="رکوردهای شخصی" description="بهترین عملکردهای ثبت‌شده در داده نمونه">
                <div className="space-y-2">
                    {prs.map(pr => (
                        <div key={pr.exercise} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                            <span
                                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning"><Award
                                className="size-5"/></span>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">{pr.exercise}</p>
                                <p className="mt-1 text-xs text-muted-foreground">رکورد
                                    قبلی {pr.previous} · {pr.date}</p>
                            </div>
                            <div className="text-left">
                                <p className="font-extrabold">{pr.current}</p>
                                <p className="mt-1 text-xs font-semibold text-success">{pr.change}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <ChartNotice/>
            </Panel>
        </div>
    )
}

function Muscles() {
    const [range, setRange] = useState('۳۰ روز')
    return (
        <div className="space-y-5">
            <Panel title="حجم عضلات" description="ست‌های مؤثر تمرین در بازه انتخاب‌شده"
                   action={<RangeSelect value={range} onChange={setRange}/>}>
                <div className="space-y-4">
                    {muscleRows.map(m => (
                        <div key={m.name}>
                            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold">{m.name}</span>
                                <span className="text-xs text-muted-foreground">{fa(m.sets)} ست</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary transition-all"
                                     style={{width: `${m.pct}%`}}/>
                            </div>
                        </div>
                    ))}
                </div>
                <ChartNotice/>
            </Panel>

            <MuscleExplorer/>
        </div>
    )
}

function BodyWeight() {
    const [goal, setGoal] = useState('75')
    const [range, setRange] = useState('۳۰ روز')
    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric title="وزن فعلی" value="۷۷٫۱ kg" detail="۱٫۱ کیلو کاهش در این ماه" icon={Weight} positive/>
                <Metric title="هدف وزن" value={`${goal} kg`} detail="هدف قابل ویرایش در این صفحه" icon={Target}/>
                <Metric title="تغییر ۳۰ روز" value="−۱٫۱ kg" detail="روند نزولی ملایم" icon={TrendingUp} positive/>
                <Metric title="ثبت وزن" value={fa(9)} detail="ورودی نمونه در این بازه" icon={CalendarDays}/>
            </div>

            <Panel title="روند وزن بدن" description="میانگین و تغییرات وزن در طول زمان"
                   action={<RangeSelect value={range} onChange={setRange}/>}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-muted-foreground" htmlFor="weight-goal">خط هدف (کیلوگرم)</label>
                    <input id="weight-goal" value={goal} onChange={e => setGoal(e.target.value.replace(/[^0-9.]/g, ''))}
                           inputMode="decimal" className="h-9 w-24 rounded-lg border bg-background px-3 text-sm"/>
                    <span className="text-xs text-muted-foreground">هدف صرفاً برای نمایش در این نمونه است.</span>
                </div>
                <div className="h-64 min-w-0 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightSeries} margin={{top: 12, right: 8, left: -15, bottom: 0}}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false}/>
                            <XAxis dataKey="date" tickLine={false} axisLine={false}
                                   tick={{fontSize: 10, fill: 'var(--muted-foreground)'}} tickMargin={10}/>
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false}
                                   tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} tickMargin={8}/>
                            <Tooltip contentStyle={tooltipStyle}
                                     labelStyle={{color: 'var(--popover-foreground)', fontWeight: 700, marginBottom: 6}}
                                     itemStyle={{color: 'var(--primary)'}}
                                     cursor={{stroke: 'var(--primary)', strokeDasharray: '4 4', strokeOpacity: 0.55}}/>
                            <Area type="monotone" dataKey="weight" name="وزن بدن" stroke="var(--chart-1)"
                                  fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2.75}
                                  dot={{r: 3, fill: 'var(--card)', stroke: 'var(--chart-1)', strokeWidth: 2}}
                                  activeDot={{r: 5, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2}}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <ChartNotice/>
            </Panel>

            <Panel title="ثبت‌های اخیر وزن" description="نمونه داده‌های وزن بدن">
                <div className="space-y-2">
                    {weightSeries.slice().reverse().slice(0, 5).map(w => (
                        <div key={w.date} className="flex items-center justify-between rounded-lg border px-4 py-3">
                            <span className="text-sm text-muted-foreground">{w.date}</span>
                            <strong>{w.weight.toFixed(1).replace('.', '٫')} kg</strong>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    )
}

export function StatsPage() {
    const [active, setActive] = useState('overview')
    return (
        <main dir="rtl" className="mx-auto w-full max-w-[1500px] space-y-5 p-3 sm:p-5 lg:p-7">
            <header className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
                <div
                    className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"/>
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <TrendingUp className="size-3.5"/> آمار و پیشرفت
            </span>
                        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">مرکز تحلیل تمرین</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                            حجم تمرین، روند قدرت، رکوردها، فعالیت سالانه، تعادل عضلات و تغییرات وزن را در یک صفحه بررسی
                            کنید.
                        </p>
                    </div>
                    <span
                        className="inline-flex items-center gap-2 self-start rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground sm:self-auto">
            <span className="size-2 rounded-full bg-warning"/> داده‌های نمایشی
          </span>
                </div>
            </header>

            <div className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActive(tab.id)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            <Icon className="size-4"/>{tab.label}
                        </button>
                    )
                })}
            </div>

            {active === 'overview' ? <Overview/> : active === 'strength' ? <Strength/> : active === 'muscles' ?
                <Muscles/> : <BodyWeight/>}

            <footer
                className="flex flex-wrap items-start gap-2 rounded-lg border border-dashed px-4 py-3 text-xs leading-5 text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0"/>
                <span>
          این رابط از الگوی آمار openGym الهام گرفته است. آمار تمرین و رکوردها در حال حاضر داده نمونه‌اند؛ بخش کاوش عضلات از API فعلی کتابخانه حرکات استفاده می‌کند و در صورت در دسترس نبودن API، نتیجه ساختگی نشان نمی‌دهد.
        </span>
            </footer>
        </main>
    )
}