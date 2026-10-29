'use client'

import {
  Activity, ArrowUpLeft, Check, ChevronDown, CircleHelp, Clock3, Dumbbell,
  FileDown, Filter, Plus, Search, ShieldCheck, Sparkles, Target, TrendingUp,
  Upload, Users, Weight, X,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'

import type { GymFeatureKey } from './gym-feature-page'

type DemoRow = { id: number; name: string; detail: string; status: string; tone?: 'good' | 'warn' | 'muted' }

const demoMembers: DemoRow[] = [
  { id: 1, name: 'آرمان رضایی', detail: 'عضو از فروردین ۱۴۰۵', status: 'فعال', tone: 'good' },
  { id: 2, name: 'نگار محمدی', detail: 'عضو از اردیبهشت ۱۴۰۵', status: 'فعال', tone: 'good' },
  { id: 3, name: 'پارسا کریمی', detail: 'عضو از خرداد ۱۴۰۵', status: 'در انتظار', tone: 'warn' },
  { id: 4, name: 'سارا احمدی', detail: 'عضو از تیر ۱۴۰۵', status: 'فعال', tone: 'good' },
]
const demoRoutines: DemoRow[] = [
  { id: 1, name: 'قدرت پایه · چهار روز', detail: '۴ روز در هفته · ۱۸ حرکت', status: 'منتشرشده', tone: 'good' },
  { id: 2, name: 'عضله‌سازی متعادل', detail: '۳ روز در هفته · ۱۵ حرکت', status: 'پیش‌نویس', tone: 'warn' },
  { id: 3, name: 'شروع هوشمند', detail: '۳ روز در هفته · مناسب مبتدی', status: 'منتشرشده', tone: 'good' },
]
const demoTrainers: DemoRow[] = [
  { id: 1, name: 'مهدی صادقی', detail: 'مربی قدرت · ۸ شاگرد', status: 'فعال', tone: 'good' },
  { id: 2, name: 'الهام نوری', detail: 'مربی آمادگی جسمانی · ۶ شاگرد', status: 'فعال', tone: 'good' },
  { id: 3, name: 'رضا مرادی', detail: 'مربی بدنسازی · ۵ شاگرد', status: 'نیازمند بررسی', tone: 'warn' },
]
const demoHistory: DemoRow[] = [
  { id: 1, name: 'جلسه بالاتنه A', detail: 'امروز، ۱۸:۲۰ · ۵۲ دقیقه · ۶ حرکت', status: 'تکمیل‌شده', tone: 'good' },
  { id: 2, name: 'پایین‌تنه B', detail: 'دیروز، ۱۹:۱۰ · ۶۱ دقیقه · ۷ حرکت', status: 'تکمیل‌شده', tone: 'good' },
  { id: 3, name: 'پشت و جلو بازو', detail: '۲ روز قبل · ۴۷ دقیقه · ۵ حرکت', status: 'تکمیل‌شده', tone: 'good' },
]

function Status({ row }: { row: DemoRow }) {
  const styles = row.tone === 'good' ? 'bg-success/10 text-success' : row.tone === 'warn' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{row.status}</span>
}

function DemoTable({ rows, onRemove }: { rows: DemoRow[]; onRemove?: (id: number) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-right text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="px-3 py-3 font-medium">عنوان</th><th className="px-3 py-3 font-medium">جزئیات</th><th className="px-3 py-3 font-medium">وضعیت</th>{onRemove && <th className="px-3 py-3 font-medium">عملیات</th>}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-3 py-4 font-semibold">{row.name}</td><td className="px-3 py-4 text-muted-foreground">{row.detail}</td><td className="px-3 py-4"><Status row={row} /></td>{onRemove && <td className="px-3 py-4"><button onClick={() => onRemove(row.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`حذف ${row.name}`}><X className="size-4" /></button></td>}</tr>)}</tbody></table>{rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">موردی مطابق جست‌وجو پیدا نشد.</p>}</div>
}

function Panel({ title, detail, action, children }: { title: string; detail?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="brand-card overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5"><div><h2 className="font-bold">{title}</h2>{detail && <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>}</div>{action}</div><div className="p-3 sm:p-5">{children}</div></section>
}

function DemoList({ feature }: { feature: GymFeatureKey }) {
  const initial = feature === 'members' ? demoMembers : feature === 'trainers' ? demoTrainers : feature === 'routines' ? demoRoutines : demoHistory
  const [rows, setRows] = useState(initial)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const copy = feature === 'members' ? { title: 'اعضای باشگاه', desc: 'اعضا و وضعیت عضویت', add: 'افزودن عضو', placeholder: 'نام عضو یا دعوت‌شونده' } : feature === 'trainers' ? { title: 'مربی‌ها و شاگردها', desc: 'نمای نمونه ارتباط مربی و شاگردان اختصاص‌یافته', add: 'انتساب جدید', placeholder: 'نام مربی یا شاگرد' } : feature === 'routines' ? { title: 'برنامه‌های تمرینی', desc: 'برنامه‌های قابل استفاده و پیش‌نویس‌های گروه', add: 'برنامه جدید', placeholder: 'نام برنامه تمرینی' } : { title: 'تاریخچه تمرین', desc: 'جلسه‌های تمرینی تکمیل‌شده در محیط نمایشی', add: 'ثبت جلسه نمونه', placeholder: 'عنوان جلسه تمرین' }
  const filtered = useMemo(() => rows.filter(row => `${row.name} ${row.detail} ${row.status}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || row.tone === filter)), [rows, search, filter])
  function addRow() { const name = newName.trim(); if (!name) return; setRows(current => [{ id: Date.now(), name, detail: 'مورد آزمایشی · ذخیره فقط در همین صفحه', status: 'نمونه', tone: 'muted' }, ...current]); setNewName(''); setShowForm(false) }
  return <Panel title={copy.title} detail={copy.desc} action={<button onClick={() => setShowForm(v => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"><Plus className="size-4" />{copy.add}</button>}>
    {showForm && <form onSubmit={e => { e.preventDefault(); addRow() }} className="mb-4 flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row"><input autoFocus value={newName} onChange={e => setNewName(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm" placeholder={copy.placeholder} /><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">افزودن به نمونه</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-3 py-2 text-sm">انصراف</button></form>}
    <div className="mb-4 flex flex-col gap-2 sm:flex-row"><label className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} className="h-10 w-full rounded-lg border bg-background pr-9 pl-3 text-sm" placeholder="جست‌وجو در نمونه‌ها..." /></label><label className="flex items-center gap-2 rounded-lg border px-3"><Filter className="size-4 text-muted-foreground" /><select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 bg-transparent text-sm outline-none"><option value="all">همه وضعیت‌ها</option><option value="good">فعال / تکمیل‌شده</option><option value="warn">در انتظار بررسی</option><option value="muted">نمونه‌های افزوده‌شده</option></select><ChevronDown className="size-4 text-muted-foreground" /></label></div>
    <DemoTable rows={filtered} onRemove={id => setRows(current => current.filter(row => row.id !== id))} />
    <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-warning"><CircleHelp className="size-4 shrink-0" /> داده‌ها نمایشی‌اند؛ افزودن و حذف فقط در state همین صفحه انجام می‌شود و به سرور ارسال نمی‌شود.</p>
  </Panel>
}

function DashboardDemo() {
  const metrics = [
    { title: 'اعضای فعال', value: '۱۲۸', delta: '+۸٫۴٪', icon: Users, tint: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
    { title: 'جلسه‌های این هفته', value: '۸۶', delta: '+۱۲٪', icon: Activity, tint: 'bg-success/10 text-success' },
    { title: 'مربی‌های فعال', value: '۹', delta: '+۲', icon: ShieldCheck, tint: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
    { title: 'برنامه‌های آماده', value: '۲۴', delta: '۶ پیش‌نویس', icon: Dumbbell, tint: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  ]
  const [period, setPeriod] = useState('week')
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => { const Icon = metric.icon; return <article key={metric.title} className="brand-card brand-card-interactive p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><span className={`flex size-11 items-center justify-center rounded-2xl ${metric.tint}`}><Icon className="size-5" /></span><span className="flex items-center gap-1 text-xs font-semibold text-success"><TrendingUp className="size-3.5" />{metric.delta}</span></div><p className="mt-4 text-sm text-muted-foreground">{metric.title}</p><p className="mt-1 text-3xl font-bold tracking-tight">{metric.value}</p></article> })}</div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
      <Panel title="روند فعالیت باشگاه" detail="نمایش نمونه تعداد جلسه‌های ثبت‌شده در بازه انتخابی" action={<select aria-label="بازه زمانی" value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-xs"><option value="week">این هفته</option><option value="month">این ماه</option></select>}>
        <div className="flex h-52 items-end justify-between gap-2 px-1 pt-4">{(period === 'week' ? [42, 65, 50, 78, 58, 88, 72] : [38, 52, 47, 63, 70, 61, 82, 76, 92, 68, 80, 95]).map((height, i, arr) => <div key={`${period}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-muted-foreground">{Math.round(height * 1.3)}</span><div className="w-full max-w-10 rounded-t-lg bg-primary/80 transition-all hover:bg-primary" style={{ height: `${height}%` }} /><span className="text-[10px] text-muted-foreground">{period === 'week' ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'][i] : `${i + 1}`}</span></div>)}</div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground"><Sparkles className="size-4 text-primary" /> اعداد این نمودار صرفاً برای پیش‌نمایش رابط کاربری هستند.</div>
      </Panel>
      <Panel title="میانبرهای کاربردی" detail="دسترسی سریع به کارهای روزمره"><div className="space-y-2">{[{ href: '/workouts', label: 'شروع تمرین', sub: 'ثبت یک جلسه جدید', icon: Activity }, { href: '/routines', label: 'برنامه‌های تمرینی', sub: 'مشاهده قالب‌ها', icon: Dumbbell }, { href: '/members', label: 'مدیریت اعضا', sub: 'مرور اعضای گروه', icon: Users }, { href: '/progress', label: 'پیشرفت و رکوردها', sub: 'بررسی روند نمونه', icon: Target }].map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-lg border p-3 transition hover:border-primary/40 hover:bg-muted/30"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{item.sub}</span></span><ArrowUpLeft className="size-4 text-muted-foreground transition group-hover:-translate-x-1" /></Link> })}</div></Panel>
    </div>
    <Panel title="فعالیت‌های اخیر" detail="نمونه جلسه‌های اخیر در گروه"><DemoTable rows={demoHistory.slice(0, 3)} /></Panel>
  </div>
}

function WorkoutDemo() {
  const [started, setStarted] = useState(false)
  const [checked, setChecked] = useState<number[]>([])
  const [seconds, setSeconds] = useState(90)
  const exercises = [{ id: 1, name: 'اسکوات هالتر', sets: '۴ ست × ۸ تکرار', muscle: 'پا' }, { id: 2, name: 'پرس سینه دمبل', sets: '۳ ست × ۱۰ تکرار', muscle: 'سینه' }, { id: 3, name: 'زیربغل قایقی', sets: '۳ ست × ۱۲ تکرار', muscle: 'پشت' }]
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.7fr)]"><Panel title="جلسه تمرینی امروز" detail="تمرین نمونه · قدرت پایه" action={<span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${started ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{started ? 'جلسه فعال' : 'آماده شروع'}</span>}><div className="mb-4 rounded-lg bg-muted/40 p-4"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">پیشرفت جلسه</span><strong>{checked.length} از {exercises.length} حرکت</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${checked.length / exercises.length * 100}%` }} /></div></div><div className="space-y-3">{exercises.map(ex => <div key={ex.id} className="flex items-center gap-3 rounded-lg border p-3"><button aria-label="علامت تکمیل حرکت" onClick={() => setChecked(prev => prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id])} className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${checked.includes(ex.id) ? 'border-success bg-success text-success-foreground' : 'bg-muted/30'}`}>{checked.includes(ex.id) ? <Check className="size-4" /> : <Dumbbell className="size-4" />}</button><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${checked.includes(ex.id) ? 'text-muted-foreground line-through' : ''}`}>{ex.name}</p><p className="mt-1 text-xs text-muted-foreground">{ex.sets} · عضله {ex.muscle}</p></div><span className="text-xs text-muted-foreground">{checked.includes(ex.id) ? 'تکمیل' : 'در انتظار'}</span></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setStarted(v => !v)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{started ? 'مکث جلسه نمونه' : 'شروع جلسه نمونه'}</button><button onClick={() => { setChecked([]); setStarted(false) }} className="rounded-lg border px-4 py-2.5 text-sm">بازنشانی</button></div></Panel><Panel title="تایمر استراحت" detail="تایمر تعاملی نمایشی"><div className="flex flex-col items-center py-5"><span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary-foreground"><Clock3 className="size-7" /></span><p className="mt-4 text-4xl font-bold tabular-nums">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</p><p className="mt-2 text-sm text-muted-foreground">مدت استراحت انتخابی</p><div className="mt-5 flex gap-2">{[60, 90, 120].map(s => <button key={s} onClick={() => setSeconds(s)} className={`rounded-lg border px-3 py-2 text-sm ${seconds === s ? 'border-primary bg-primary/10 text-primary-foreground' : ''}`}>{s} ثانیه</button>)}</div><p className="mt-4 text-center text-xs leading-5 text-muted-foreground">این تایمر فقط مقدار نمایشی را تغییر می‌دهد؛ زمان‌سنج پس‌زمینه و ذخیره جلسه متصل نیست.</p></div></Panel></div>
}

function ProgressDemo({ measurements = false }: { measurements?: boolean }) {
  const [weight, setWeight] = useState('77.0')
  const [waist, setWaist] = useState('90')
  const [saved, setSaved] = useState(false)
  const values = [72, 68, 65, 62, 58, 53, 49]
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]"><Panel title={measurements ? 'ثبت اندازه‌گیری بدن' : 'روند پیشرفت' } detail={measurements ? 'ثبت آزمایشی وزن و دور کمر' : 'روند نمونه بر اساس هفت هفته فرضی'}>{measurements ? <form onSubmit={e => { e.preventDefault(); setSaved(true) }} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">وزن (کیلوگرم)<input value={weight} onChange={e => { setWeight(e.target.value); setSaved(false) }} inputMode="decimal" className="mt-2 h-11 w-full rounded-lg border bg-background px-3" /></label><label className="text-sm font-medium">دور کمر (سانتی‌متر)<input value={waist} onChange={e => { setWaist(e.target.value); setSaved(false) }} inputMode="decimal" className="mt-2 h-11 w-full rounded-lg border bg-background px-3" /></label><label className="text-sm font-medium">درصد چربی<input defaultValue="۱۸٫۵" className="mt-2 h-11 w-full rounded-lg border bg-background px-3" /></label><label className="text-sm font-medium">دور سینه (سانتی‌متر)<input defaultValue="۹۷" className="mt-2 h-11 w-full rounded-lg border bg-background px-3" /></label><button className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground sm:col-span-2">ثبت نمونه</button>{saved && <p className="text-sm text-success sm:col-span-2">مقادیر در همین صفحه ثبت نمایشی شدند؛ به سرور ارسال نشده‌اند.</p>}</form> : <><div className="flex h-48 items-end gap-3">{values.map((v, i) => <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full rounded-t-lg bg-primary/80" style={{ height: `${v}%` }} /><span className="text-[10px] text-muted-foreground">هفته {i + 1}</span></div>)}</div><p className="mt-4 text-xs text-muted-foreground">نمودار صرفاً تصویر نمونه است و به معنی پیشرفت واقعی هیچ کاربری نیست.</p></>}</Panel><Panel title={measurements ? 'آخرین اندازه‌ها' : 'رکوردهای شخصی'} detail="داده‌های نمایشی برای بررسی چیدمان"><div className="space-y-3">{(measurements ? [{ a: 'وزن نمونه', b: '۷۷٫۰ کیلوگرم', c: 'ثابت' }, { a: 'دور کمر', b: '۹۰ سانتی‌متر', c: '−۲ سانتی‌متر' }, { a: 'درصد چربی', b: '۱۸٫۵٪', c: '−۰٫۵٪' }] : [{ a: 'اسکوات هالتر', b: '۱۰۰ کیلوگرم', c: 'رکورد نمونه' }, { a: 'پرس سینه', b: '۷۵ کیلوگرم', c: 'رکورد نمونه' }, { a: 'ددلیفت', b: '۱۳۰ کیلوگرم', c: 'رکورد نمونه' }]).map(row => <div key={row.a} className="flex items-center gap-3 rounded-lg border p-3"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground"><Weight className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{row.a}</p><p className="mt-1 text-xs text-muted-foreground">{row.c}</p></div><strong className="text-sm">{row.b}</strong></div>)}</div></Panel></div>
}

function ImportDemo() {
  const [fileName, setFileName] = useState('')
  const [exported, setExported] = useState(false)
  return <div className="grid gap-5 lg:grid-cols-2"><Panel title="ورود سابقه تمرین" detail="فقط انتخاب فایل در مرورگر؛ پردازش یا آپلود انجام نمی‌شود."><label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-6 text-center hover:border-primary/50"><span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary-foreground"><Upload className="size-5" /></span><span className="mt-3 font-semibold">فایل CSV یا JSON را انتخاب کنید</span><span className="mt-1 text-xs text-muted-foreground">برای مشاهده وضعیت انتخاب فایل</span><input type="file" accept=".csv,.json" className="sr-only" onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} /></label>{fileName && <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">فایل انتخاب‌شده: <b>{fileName}</b> — هنوز بارگذاری نشده است.</p>}</Panel><Panel title="خروجی اطلاعات" detail="پیش‌نمایش عملیات خروجی گرفتن از داده‌های حساب"><div className="rounded-lg border p-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground"><FileDown className="size-5" /></span><div><p className="font-semibold">بسته اطلاعات شخصی</p><p className="mt-1 text-xs text-muted-foreground">تمرین‌ها، اندازه‌ها و ترجیحات · داده نمونه</p></div></div><button onClick={() => setExported(true)} className="mt-4 w-full rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-muted/40">{exported ? 'درخواست نمونه ثبت شد' : 'پیش‌نمایش درخواست خروجی'}</button>{exported && <p className="mt-3 text-xs text-warning">خروجی واقعی ساخته نشده است؛ API خروجی هنوز پیاده‌سازی نشده.</p>}</div></Panel></div>
}

function SettingsDemo() {
  const [language, setLanguage] = useState('fa')
  const [unit, setUnit] = useState('kg')
  const [week, setWeek] = useState('sat')
  const [rest, setRest] = useState('90')
  const [saved, setSaved] = useState(false)
  return <Panel title="ترجیحات تمرین" detail="تنظیمات نمایشی زبان، واحدها و تجربه تمرین"><form onSubmit={e => { e.preventDefault(); setSaved(true) }} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">زبان رابط<select value={language} onChange={e => { setLanguage(e.target.value); setSaved(false) }} className="mt-2 h-11 w-full rounded-lg border bg-background px-3"><option value="fa">فارسی</option><option value="en">English</option></select></label><label className="text-sm font-medium">واحد وزن<select value={unit} onChange={e => { setUnit(e.target.value); setSaved(false) }} className="mt-2 h-11 w-full rounded-lg border bg-background px-3"><option value="kg">کیلوگرم</option><option value="lb">پوند</option></select></label><label className="text-sm font-medium">شروع هفته<select value={week} onChange={e => { setWeek(e.target.value); setSaved(false) }} className="mt-2 h-11 w-full rounded-lg border bg-background px-3"><option value="sat">شنبه</option><option value="mon">دوشنبه</option><option value="sun">یکشنبه</option></select></label><label className="text-sm font-medium">استراحت پیش‌فرض (ثانیه)<input value={rest} onChange={e => { setRest(e.target.value); setSaved(false) }} type="number" min="0" max="900" className="mt-2 h-11 w-full rounded-lg border bg-background px-3" /></label><div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">ذخیره نمونه</button>{saved && <span className="text-sm text-success">ترجیحات فقط در همین صفحه ثبت شدند.</span>}</div></form></Panel>
}

export function GymDemoWorkspace({ feature }: { feature: GymFeatureKey }) {
  return <div className="space-y-5">{feature === 'overview' ? <DashboardDemo /> : feature === 'members' || feature === 'trainers' || feature === 'routines' || feature === 'history' ? <DemoList feature={feature} /> : feature === 'workouts' ? <WorkoutDemo /> : feature === 'progress' ? <ProgressDemo /> : feature === 'measurements' ? <ProgressDemo measurements /> : feature === 'imports' ? <ImportDemo /> : feature === 'settings' ? <SettingsDemo /> : <div className="rounded-2xl border p-6 text-sm text-muted-foreground">کتابخانه حرکات از API موجود استفاده می‌کند.</div>}
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> حالت پیش‌نمایش · داده‌های ساختگی و تعاملات محلی</span><span>هیچ داده‌ای به API ارسال نمی‌شود.</span></div>
  </div>
}
