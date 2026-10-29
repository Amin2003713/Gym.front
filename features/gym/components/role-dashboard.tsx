'use client'

import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  Target,
  TrendingUp,
  Users,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

const fa = (n: number) => n.toLocaleString('fa-IR')

type Role = 'owner' | 'trainer' | 'trainee'

function normalizeRole(value: unknown): Role | null {
  // Backend sends integer role values (C# Roles enum: Admin=0, Trainer=1,
  // Trainee=2); older payloads may still carry enum names.
  const role = String(value ?? '').toLowerCase().replace(/[ _-]/g, '')
  if (['0', 'owner', 'admin', 'administrator'].includes(role)) return 'owner'
  if (['1', 'trainer', 'Trainer', 'coach'].includes(role)) return 'trainer'
  if (['2', 'trainee', 'member', 'user'].includes(role)) return 'trainee'
  return null
}

function useDashboardRole(): Role {
  const { data } = useSession()
  const raw = data?.user?.role
  const roles = Array.isArray(raw) ? raw : raw ? [raw] : []
  const normalized = roles.map(normalizeRole).filter((role): role is Role => role !== null)
  // Least-privileged fallback until the session role is available.
  if (normalized.includes('owner')) return 'owner'
  if (normalized.includes('trainer')) return 'trainer'
  return 'trainee'
}

/** Trainees land straight on their training progress instead of an admin-style dashboard. */
function TraineeProgressRedirect({ href }: { href: (path: string) => string }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(href('/progress'))
  }, [href, router])
  return <div dir="rtl" className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">در حال انتقال به پیشرفت تمرین…</div>
}

function tenantLinks() {
  return (path: string) => (path === '/' ? '/' : path)
}

function Panel({ title, description, action, children, className = '' }: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return <section className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
      <div><h2 className="font-bold tracking-tight">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}</div>
      {action}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
}

function Stat({ label, value, detail, icon: Icon, tone = 'primary' }: {
  label: string; value: string; detail: string; icon: LucideIcon; tone?: 'primary' | 'green' | 'orange' | 'blue'
}) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary-foreground', green: 'bg-success/10 text-success',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  }[tone]
  return <div className="rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p></div><span className={`flex size-11 items-center justify-center rounded-lg ${toneClass}`}><Icon className="size-5" /></span></div>
    <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
  </div>
}

function Heading({ eyebrow, title, subtitle, name }: { eyebrow: string; title: string; subtitle: string; name?: string }) {
  return <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
    <div className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{eyebrow}</span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}{name ? `، ${name}` : ''}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 self-start rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground sm:self-auto"><span className="size-2 rounded-full bg-warning" />دموی تعاملی · داده نمونه</div>
    </div>
  </div>
}

function QuickLink({ href, icon: Icon, title, detail }: { href: string; icon: LucideIcon; title: string; detail: string }) {
  return <Link href={href} className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground"><Icon className="size-5" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</span></span>
    <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
  </Link>
}

function WeekBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1)
  return <div className="flex h-40 items-end justify-between gap-2 pt-3">{values.map((value, i) => <div key={labels[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
    <span className="text-[10px] text-muted-foreground">{fa(value)}</span><div className="flex h-full w-full items-end justify-center"><div className="w-full max-w-8 rounded-t-lg bg-primary/80 transition-all" style={{ height: `${Math.max(8, value / max * 100)}%` }} /></div><span className="text-xs text-muted-foreground">{labels[i]}</span>
  </div>)}</div>
}

const ownerMembers = [
  { name: 'آرمان رضایی', meta: 'مربی قدرت', status: 'فعال', color: 'bg-success/10 text-success' },
  { name: 'نگار محمدی', meta: 'عضو باشگاه', status: 'فعال', color: 'bg-success/10 text-success' },
  { name: 'پارسا کریمی', meta: 'عضو باشگاه', status: 'در انتظار', color: 'bg-warning/10 text-warning' },
  { name: 'سارا احمدی', meta: 'مربی فیتنس', status: 'فعال', color: 'bg-success/10 text-success' },
]

function OwnerDashboard({ href }: { href: (path: string) => string }) {
  return <>
    <Heading eyebrow="پنل مالک باشگاه" title="داشبورد مدیریت" subtitle="نمایی از وضعیت گروه، اعضا، مربیان و فعالیت هفتگی باشگاه. اعداد فعلی نمایشی‌اند و پس از آماده‌شدن API جایگزین می‌شوند." name="مدیر" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="اعضای فعال" value={fa(324)} detail="۱۲ عضو جدید در این ماه" icon={Users} tone="primary" />
      <Stat label="مربیان فعال" value={fa(24)} detail="۳ مربی در حال برگزاری جلسه" icon={BadgeCheck} tone="green" />
      <Stat label="برنامه‌های فعال" value={fa(24)} detail="۷ برنامه در حال استفاده" icon={Dumbbell} tone="blue" />
      <Stat label="جلسه‌های این هفته" value={fa(186)} detail="۱۲٪ بیشتر از هفته قبل" icon={TrendingUp} tone="orange" />
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.85fr)]">
      <Panel title="فعالیت هفتگی" description="تعداد جلسه‌های ثبت‌شده در روزهای هفته" action={<span className="rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-bold text-success">+۱۲٪ رشد</span>}>
        <WeekBars values={[18, 24, 20, 31, 27, 38, 28]} labels={['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']} />
        <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground"><span>مجموع جلسه‌ها</span><strong className="text-foreground">{fa(186)} جلسه</strong></div>
      </Panel>
      <Panel title="میانبرهای مدیریت" description="دسترسی سریع به بخش‌های اصلی گروه">
        <div className="grid gap-2"><QuickLink href={href('/users')} icon={Users} title="مدیریت کاربران" detail="نقش‌ها، وضعیت و حساب‌ها" /><QuickLink href={href('/trainers')} icon={BadgeCheck} title="مربی‌ها و شاگردها" detail="انتساب و بررسی پیشرفت" /><QuickLink href={href('/routines')} icon={Dumbbell} title="برنامه‌های تمرینی" detail="ساخت و مدیریت برنامه‌ها" /></div>
      </Panel>
    </div>
    <Panel title="فعالیت اخیر" description="آخرین تغییرات اعضا و مربیان در داده‌های نمونه" action={<Button asChild variant="outline" size="sm"><Link href={href('/members')}>مشاهده اعضا <ArrowUpLeft className="size-4" /></Link></Button>}>
      <div className="overflow-x-auto"><table className="w-full min-w-[470px] text-right text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="pb-3 font-medium">نام</th><th className="pb-3 font-medium">نقش</th><th className="pb-3 font-medium">وضعیت</th><th className="pb-3 font-medium">آخرین فعالیت</th></tr></thead><tbody>{ownerMembers.map((member, i) => <tr key={member.name} className="border-b last:border-0"><td className="py-3.5 font-semibold">{member.name}</td><td className="py-3.5 text-muted-foreground">{member.meta}</td><td className="py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.color}`}>{member.status}</span></td><td className="py-3.5 text-muted-foreground">{['۵ دقیقه پیش', '۲۵ دقیقه پیش', '۱ ساعت پیش', 'امروز'][i]}</td></tr>)}</tbody></table></div>
    </Panel>
  </>
}

const traineeRows = [
  { name: 'آرمان رضایی', goal: 'افزایش قدرت', progress: 82, last: 'امروز · بالاتنه A', status: 'در مسیر هدف' },
  { name: 'نگار محمدی', goal: 'تناسب اندام', progress: 64, last: 'دیروز · فول‌بادی', status: 'نیازمند پیگیری' },
  { name: 'پارسا کریمی', goal: 'عضله‌سازی', progress: 45, last: '۳ روز پیش', status: 'جلسه عقب‌افتاده' },
]

function TrainerDashboard({ href }: { href: (path: string) => string }) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => traineeRows.filter(x => `${x.name} ${x.goal} ${x.status}`.includes(query.trim())), [query])
  return <>
    <Heading eyebrow="پنل مربی" title="فضای مربی‌گری" subtitle="برنامه جلسات، شاگردان اختصاص‌یافته و پیگیری روند تمرین را از یکجا مدیریت کنید." name="مربی" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="شاگردان من" value={fa(18)} detail="۲ شاگرد جدید این ماه" icon={Users} /><Stat label="جلسه امروز" value={fa(4)} detail="۲ جلسه باقی‌مانده" icon={CalendarDays} tone="blue" /><Stat label="جلسه‌های این هفته" value={fa(26)} detail="۹۱٪ تکمیل‌شده" icon={Dumbbell} tone="green" /><Stat label="نیازمند پیگیری" value={fa(3)} detail="شاگردانی با تمرین عقب‌افتاده" icon={Bell} tone="orange" /></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <Panel title="شاگردان اختصاص‌یافته" description="پیشرفت و آخرین فعالیت شاگردان (داده نمونه)" action={<Button asChild variant="outline" size="sm"><Link href={href('/trainers')}>مدیریت شاگردها <ArrowUpLeft className="size-4" /></Link></Button>}>
        <label className="mb-4 block"><span className="sr-only">جست‌وجوی شاگرد</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی نام، هدف یا وضعیت..." className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <div className="space-y-3">{visible.map(row => <div key={row.name} className="rounded-lg border p-3.5"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">هدف: {row.goal} · {row.last}</p></div><span className="text-xs text-muted-foreground">{fa(row.progress)}٪</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${row.progress}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{row.status}</p></div>)}{visible.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">شاگردی پیدا نشد.</p>}</div>
      </Panel>
      <div className="space-y-5">
        <Panel title="برنامه امروز" description="برنامه پیشنهادی جلسات مربی"><div className="space-y-3">{[{time:'۰۹:۰۰',name:'جلسه قدرت · آرمان رضایی',detail:'۴۵ دقیقه · جلسه حضوری'},{time:'۱۱:۳۰',name:'ارزیابی اولیه · سارا نادری',detail:'۳۰ دقیقه · سنجش آمادگی'},{time:'۱۷:۰۰',name:'جلسه فیتنس · نگار محمدی',detail:'۵۰ دقیقه · جلسه حضوری'}].map(x => <div key={x.time} className="flex gap-3"><div className="w-14 shrink-0 rounded-lg bg-primary/10 px-2 py-2 text-center text-xs font-bold text-primary">{x.time}</div><div className="min-w-0 flex-1 border-b pb-3 last:border-0"><p className="text-sm font-semibold">{x.name}</p><p className="mt-1 text-xs text-muted-foreground">{x.detail}</p></div></div>)}</div></Panel>
        <Panel title="میانبرها"><div className="grid gap-2"><QuickLink href={href('/routines')} icon={Dumbbell} title="برنامه‌ریزی تمرین" detail="مرور و ساخت برنامه" /><QuickLink href={href('/progress')} icon={TrendingUp} title="گزارش پیشرفت" detail="رکوردها و روند شاگردان" /><QuickLink href={href('/history')} icon={Clock3} title="تاریخچه جلسات" detail="جلسات تکمیل‌شده" /></div></Panel>
      </div>
    </div>
  </>
}

function TraineeDashboard({ href }: { href: (path: string) => string }) {
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState<number[]>([])
  const exercises = [{ name: 'اسکوات با هالتر', sets: '۳ ست × ۸ تکرار', muscle: 'پا و باسن' }, { name: 'پرس سینه', sets: '۳ ست × ۱۰ تکرار', muscle: 'سینه' }, { name: 'قایقی سیم‌کش', sets: '۳ ست × ۱۲ تکرار', muscle: 'پشت' }, { name: 'پلانک', sets: '۳ ست × ۴۵ ثانیه', muscle: 'میان‌تنه' }]
  return <>
    <Heading eyebrow="فضای تمرین من" title="آماده‌ای برای پیشرفت؟" subtitle="برنامه امروزت را دنبال کن، ست‌ها را ثبت کن و روند پیشرفتت را ببین." name="ورزشکار" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="تمرین این هفته" value={`${fa(3)} از ${fa(4)}`} detail="یک جلسه تا هدف هفتگی" icon={Dumbbell} /><Stat label="وزن فعلی" value="۷۷٫۴ kg" detail="۰٫۶ کیلو کمتر از ماه قبل" icon={Weight} tone="blue" /><Stat label="رکوردهای شخصی" value={fa(8)} detail="۲ رکورد جدید این ماه" icon={Target} tone="green" /><Stat label="روزهای پیوسته" value={fa(6)} detail="ثبات، نتیجه می‌سازد" icon={Flame} tone="orange" /></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <Panel title="تمرین امروز · بالاتنه و میان‌تنه" description="برنامه قدرت پایه · حدود ۴۵ دقیقه" action={<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{fa(done.length)} / {fa(exercises.length)} حرکت</span>}>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-3"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground"><Dumbbell className="size-5" /></span><div className="flex-1"><p className="text-sm font-bold">جلسه قدرت · روز A</p><p className="mt-1 text-xs text-muted-foreground">۴ حرکت · ۱۲ ست · استراحت ۹۰ ثانیه</p></div><Button onClick={() => setStarted(v => !v)} size="sm">{started ? 'پایان جلسه' : 'شروع تمرین'} <ArrowLeft className="size-4" /></Button></div>
        <div className="space-y-2">{exercises.map((exercise, i) => <div key={exercise.name} className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${done.includes(i) ? 'border-success/30 bg-success/5' : ''}`}><button onClick={() => setDone(current => current.includes(i) ? current.filter(x => x !== i) : [...current, i])} aria-label={`ثبت ${exercise.name}`} className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${done.includes(i) ? 'border-success bg-success text-success-foreground' : 'bg-background text-muted-foreground hover:border-primary'}`}>{done.includes(i) ? <Check className="size-4" /> : <Dumbbell className="size-4" />}</button><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${done.includes(i) ? 'text-muted-foreground line-through' : ''}`}>{exercise.name}</p><p className="mt-1 text-xs text-muted-foreground">{exercise.sets} · {exercise.muscle}</p></div><span className="text-xs text-muted-foreground">{done.includes(i) ? 'تکمیل شد' : 'برنامه‌ریزی‌شده'}</span></div>)}</div>
        {started && <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs leading-5 text-warning">جلسه در حالت نمایشی شروع شده است؛ ثبت واقعی تمرین پس از آماده‌شدن API فعال می‌شود.</p>}
      </Panel>
      <div className="space-y-5">
        <Panel title="پیشرفت این هفته" description="تعداد جلسه‌های تمرین روزانه"><WeekBars values={[1, 0, 1, 1, 0, 0, 0]} labels={['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']} /><p className="mt-4 border-t pt-3 text-xs text-muted-foreground">هدف هفتگی: ۴ جلسه · انجام‌شده: ۳ جلسه</p></Panel>
        <Panel title="میانبرهای من"><div className="grid gap-2"><QuickLink href={href('/routines')} icon={CalendarDays} title="برنامه هفتگی" detail="بررسی روزهای تمرین" /><QuickLink href={href('/progress')} icon={TrendingUp} title="رکوردها و پیشرفت" detail="مشاهده روند عملکرد" /><QuickLink href={href('/measurements')} icon={HeartPulse} title="اندازه‌گیری بدن" detail="ثبت وزن و اندازه‌ها" /><QuickLink href={href('/history')} icon={Clock3} title="تاریخچه تمرین" detail="مرور جلسات قبلی" /></div></Panel>
      </div>
    </div>
    <Panel title="هدف بعدی تو" description="نمونه هدف هفتگی"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600"><Zap className="size-6" /></span><div className="flex-1"><p className="font-bold">۴ جلسه تمرین در هفته</p><p className="mt-1 text-sm text-muted-foreground">یک جلسه دیگر انجام بده تا به هدف این هفته برسی.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-primary" /></div></div><span className="text-sm font-bold">۷۵٪</span></div></Panel>
  </>
}

export function RoleDashboard() {
  const role = useDashboardRole()
  const href = tenantLinks()
  return <main dir="rtl" className="mx-auto w-full max-w-[1440px] space-y-5 p-3 sm:p-5 lg:space-y-6 lg:p-7">
    {role === 'owner' ? <OwnerDashboard href={href} /> : role === 'trainer' ? <TrainerDashboard href={href} /> : <TraineeProgressRedirect href={href} />}
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />حالت نمونه برای آماده‌سازی رابط</span><span>تغییرات این داشبورد به API ارسال نمی‌شوند.</span></div>
  </main>
}
