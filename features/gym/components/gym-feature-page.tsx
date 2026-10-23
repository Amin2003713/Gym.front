'use client'

import {
  Activity,
  ArrowUpLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  CircleAlert,
  Dumbbell,
  FileUp,
  GitBranch,
  History,
  Settings2,
  ShieldCheck,
  Users,
  type LucideIcon,
  Search,
  Plus,
  Filter,
  Timer,
  Upload,
} from 'lucide-react'
import Link from 'next/link'

export type GymFeatureKey =
  | 'overview'
  | 'exercises'
  | 'routines'
  | 'workouts'
  | 'history'
  | 'progress'
  | 'measurements'
  | 'imports'
  | 'branches'
  | 'members'
  | 'trainers'
  | 'settings'

const features: Record<GymFeatureKey, {
  title: string
  eyebrow: string
  description: string
  icon: LucideIcon
  bullets: string[]
  apiMethods: string[]
}> = {
  overview: {
    title: 'داشبورد باشگاه', eyebrow: 'نمای کلی', description: 'نمای کلی تمرین‌ها، اعضا و فعالیت‌های گروه باشگاهی شما.', icon: Activity,
    bullets: ['جلسه‌های تمرینی اخیر', 'روند پیشرفت اعضا', 'میانبرهای مدیریت تمرین'], apiMethods: ['getGroupSummary', 'listWorkoutHistory', 'listMembers'],
  },
  exercises: {
    title: 'کتابخانه حرکات', eyebrow: 'تمرین', description: 'جست‌وجو و دسته‌بندی حرکات بر اساس عضله، تجهیزات و نوع تمرین.', icon: Dumbbell,
    bullets: ['جست‌وجو و فیلتر حرکات', 'عضلات اصلی و کمکی', 'تصویر، GIF یا SVG متحرک در صورت ارائه توسط API'], apiMethods: ['listExercises', 'getExercise', 'createExercise', 'updateExercise', 'deleteExercise'],
  },
  routines: {
    title: 'برنامه‌های تمرینی', eyebrow: 'تمرین', description: 'ساخت و مدیریت برنامه‌ها، روزهای تمرین، ست‌ها و سوپرست‌ها.', icon: BookOpen,
    bullets: ['برنامه‌های هفتگی و چرخشی', 'ست‌های گرم‌کردن و کاری', 'استراحت بین ست‌ها و یادداشت‌ها'], apiMethods: ['listRoutines', 'getRoutine', 'createRoutine', 'updateRoutine', 'archiveRoutine'],
  },
  workouts: {
    title: 'تمرین امروز', eyebrow: 'تمرین', description: 'ثبت یک جلسه تمرین و دنبال‌کردن ست‌ها، تکرارها و زمان استراحت.', icon: CalendarDays,
    bullets: ['شروع تمرین از روی برنامه', 'ثبت وزن، تکرار و زمان', 'پایان جلسه و ذخیره سابقه'], apiMethods: ['startWorkout', 'getWorkout', 'completeWorkout'],
  },
  history: {
    title: 'تاریخچه تمرین', eyebrow: 'فعالیت', description: 'مرور جلسات گذشته و بررسی جزئیات هر جلسه.', icon: History,
    bullets: ['فیلتر بازه زمانی', 'تاریخچه تمرین عضو', 'جزئیات ست‌ها و رکوردها'], apiMethods: ['listWorkoutHistory', 'getWorkout'],
  },
  progress: {
    title: 'پیشرفت و رکوردها', eyebrow: 'تحلیل', description: 'نمایش روند تمرین و رکوردهای شخصی بر اساس داده‌های ثبت‌شده.', icon: ChartNoAxesCombined,
    bullets: ['رکوردهای شخصی', 'روند پیشرفت تمرین', 'گزارش برای عضو یا شاگرد اختصاص‌یافته'], apiMethods: ['listPersonalRecords', 'listWorkoutHistory', 'listBodyMeasurements'],
  },
  measurements: {
    title: 'اندازه‌گیری بدن', eyebrow: 'پیشرفت', description: 'ثبت وزن، درصد چربی و اندازه‌های بدن در طول زمان.', icon: Activity,
    bullets: ['وزن و درصد چربی بدن', 'اندازه‌های بدن', 'نمودار تغییرات در طول زمان'], apiMethods: ['listBodyMeasurements', 'upsertBodyMeasurement'],
  },
  imports: {
    title: 'ورود و خروجی اطلاعات', eyebrow: 'ابزارها', description: 'آماده‌سازی رابط واردکردن سابقه تمرین و خروجی‌گرفتن از اطلاعات.', icon: FileUp,
    bullets: ['ورود سابقه از فایل', 'نمایش خطاهای ردیف‌های نامعتبر', 'خروجی اطلاعات کاربر'], apiMethods: ['importWorkoutHistory', 'exportMyData'],
  },
  branches: {
    title: 'شعبه‌های گروه', eyebrow: 'مدیریت گروه', description: 'مدیریت شعبه‌ها و تنظیمات پایه هر محل باشگاه.', icon: GitBranch,
    bullets: ['اطلاعات شعبه', 'شعبه مرکزی', 'وضعیت فعال یا غیرفعال'], apiMethods: ['listBranches', 'getGroupSummary'],
  },
  members: {
    title: 'اعضای باشگاه', eyebrow: 'مدیریت گروه', description: 'مدیریت اعضا و دعوت‌نامه‌ها در محدوده گروه و شعبه انتخاب‌شده.', icon: Users,
    bullets: ['فهرست اعضا و نقش‌ها', 'دعوت عضو جدید', 'انتساب عضو به شعبه'], apiMethods: ['listMembers', 'inviteMember', 'listBranches'],
  },
  trainers: {
    title: 'مربی‌ها و شاگردها', eyebrow: 'مدیریت گروه', description: 'مدیریت ارتباط مربی و شاگرد و آماده‌سازی دسترسی به پیشرفت شاگردان اختصاص‌یافته.', icon: ShieldCheck,
    bullets: ['انتساب مربی به شاگرد', 'نمایش شاگردان اختصاص‌یافته', 'دسترسی به سابقه تمرین طبق مجوز'], apiMethods: ['listTrainerAssignments', 'listWorkoutHistory', 'listBodyMeasurements'],
  },
  settings: {
    title: 'تنظیمات', eyebrow: 'حساب و تجربه', description: 'تنظیمات زبان، واحدها، شروع هفته و رفتار تایمر تمرین.', icon: Settings2,
    bullets: ['زبان و چینش راست‌چین', 'واحد وزن و مسافت', 'تایمر استراحت و نمایش RPE/RIR'], apiMethods: ['getPreferences', 'updatePreferences'],
  },
}

function WorkspacePreview({ feature }: { feature: GymFeatureKey }) {
  const panel = 'rounded-2xl border bg-card p-5 sm:p-6'
  const disabled = 'cursor-not-allowed opacity-50'
  const action = 'inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50'
  const field = 'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'
  const quiet = 'rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground'
  const Empty = ({ title, detail }: { title: string; detail: string }) => (
    <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-7 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted"><CircleAlert className="size-5 text-muted-foreground" /></span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-md text-xs leading-6 text-muted-foreground">{detail}</p>
    </div>
  )

  if (feature === 'overview') {
    const shortcuts: Array<{ href: string; label: string; detail: string; icon: LucideIcon }> = [
      { href: '/workouts', label: 'شروع تمرین', detail: 'جلسه هدایت‌شده و ثبت ست‌ها', icon: Timer },
      { href: '/routines', label: 'برنامه‌ها', detail: 'ساخت و ویرایش برنامه تمرینی', icon: BookOpen },
      { href: '/exercises', label: 'کتابخانه حرکات', detail: 'جست‌وجوی حرکت و عضلات هدف', icon: Dumbbell },
      { href: '/progress', label: 'پیشرفت', detail: 'رکوردها و روند تمرین', icon: ChartNoAxesCombined },
    ]
    return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{shortcuts.map((shortcut) => {
      const ShortcutIcon = shortcut.icon
      return <Link key={shortcut.href} href={shortcut.href} className={`${panel} group transition-colors hover:border-primary/40`}><span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShortcutIcon className="size-5" /></span><h3 className="font-semibold">{shortcut.label}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{shortcut.detail}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">ورود به بخش <ArrowUpLeft className="size-4 transition-transform group-hover:-translate-x-1" /></span></Link>
    })}</section>
  }

  if (feature === 'exercises') return <section className={panel}>
    <div className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search className="absolute right-3 top-3 size-4 text-muted-foreground" /><input className={`${field} pr-9`} placeholder="جست‌وجوی حرکت..." disabled /></label><select className={`${field} md:max-w-48`} disabled defaultValue=""><option value="">همه گروه‌های عضلانی</option></select><select className={`${field} md:max-w-40`} disabled defaultValue=""><option value="">همه تجهیزات</option></select><button className={action} disabled><Plus className="size-4" /> افزودن حرکت</button></div>
    <div className="mt-5"><Empty title="کتابخانه حرکات هنوز بارگذاری نشده است" detail="پس از اتصال API، فهرست حرکات با جست‌وجو و فیلترها نمایش داده می‌شود. تصاویر، GIF و SVG متحرک فقط در صورت ارسال URL معتبر از سمت سرور نمایش داده خواهند شد." /></div>
  </section>

  if (feature === 'routines') return <section className={panel}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">برنامه‌های شما</h2><p className="mt-1 text-sm text-muted-foreground">برنامه‌های هفتگی، چرخشی و قالب‌های قابل ویرایش</p></div><button className={action} disabled><Plus className="size-4" /> برنامه جدید</button></div>
    <div className="mt-5"><Empty title="هنوز برنامه‌ای در دسترس نیست" detail="بعد از اتصال بک‌اند، برنامه‌ها، روزهای تمرین، ترتیب حرکات، سوپرست‌ها و ست‌های هدف در این قسمت مدیریت می‌شوند." /></div>
  </section>

  if (feature === 'workouts') return <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
    <div className={panel}><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Timer className="size-5" /></span><div><h2 className="font-semibold">جلسه تمرینی جدید</h2><p className="mt-1 text-sm text-muted-foreground">از یک برنامه شروع کنید یا جلسه آزاد بسازید.</p></div></div><div className="mt-5 space-y-3"><label className="block text-sm font-medium">انتخاب برنامه<select className={`${field} mt-2`} disabled defaultValue=""><option value="">ابتدا API را متصل کنید</option></select></label><button className={`${action} w-full justify-center`} disabled><CalendarDays className="size-4" /> شروع تمرین</button></div></div>
    <div className={panel}><h2 className="font-semibold">آماده تمرین؟</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">نمای جلسه شامل ست‌های کاری و گرم‌کردن، تایمر استراحت، RPE/RIR و ثبت رکورد پس از اتصال API فعال می‌شود.</p><div className="mt-4"><Empty title="جلسه فعالی وجود ندارد" detail="برای جلوگیری از داده ساختگی، جلسه تمرینی تا زمان اتصال سرویس ایجاد نمی‌شود." /></div></div>
  </section>

  if (feature === 'history') return <section className={panel}><div className="flex flex-col gap-3 sm:flex-row"><input className={field} placeholder="از تاریخ" disabled /><input className={field} placeholder="تا تاریخ" disabled /><select className={field} disabled defaultValue=""><option value="">همه اعضا</option></select><button className={quiet} disabled><Filter className="ml-2 inline size-4" /> فیلتر</button></div><div className="mt-5"><Empty title="تاریخچه‌ای برای نمایش وجود ندارد" detail="جلسه‌های تکمیل‌شده و جزئیات ست‌ها پس از اتصال API و دریافت داده واقعی نمایش داده می‌شوند." /></div></section>

  if (feature === 'progress' || feature === 'measurements') return <section className="grid gap-4 lg:grid-cols-2"><div className={panel}><h2 className="font-semibold">روند در طول زمان</h2><p className="mt-1 text-sm text-muted-foreground">نمودار از داده‌های واقعی کاربر ساخته می‌شود.</p><div className="mt-5"><Empty title="داده‌ای برای نمودار وجود ندارد" detail="برای جلوگیری از نتیجه‌گیری اشتباه، نمودار تا زمان دریافت اندازه‌گیری‌ها و تاریخچه تمرین خالی می‌ماند." /></div></div><div className={panel}><h2 className="font-semibold">{feature === 'measurements' ? 'ثبت اندازه‌گیری' : 'رکوردهای شخصی'}</h2><p className="mt-1 text-sm text-muted-foreground">{feature === 'measurements' ? 'وزن، درصد چربی و اندازه‌های بدن' : 'بهترین عملکرد ثبت‌شده برای هر حرکت'}</p>{feature === 'measurements' ? <div className="mt-4 grid grid-cols-2 gap-3"><input className={field} placeholder="وزن (کیلوگرم)" disabled /><input className={field} placeholder="درصد چربی" disabled /><input className={field} placeholder="دور کمر (سانتی‌متر)" disabled /><input className={field} placeholder="دور سینه (سانتی‌متر)" disabled /><button className={`${action} col-span-2 justify-center`} disabled><Plus className="size-4" /> ثبت اندازه‌گیری</button></div> : <div className="mt-5"><Empty title="رکوردی ثبت نشده است" detail="رکوردها بعد از دریافت سوابق واقعی تمرین محاسبه می‌شوند." /></div>}</div></section>

  if (feature === 'imports') return <section className={panel}><div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Upload className="size-7" /></span><h2 className="mt-4 font-semibold">واردکردن سابقه تمرین</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">ناحیه انتخاب فایل برای قالب‌های پشتیبانی‌شده بعد از مشخص‌شدن قراردادهای .NET فعال می‌شود.</p><button className={`${action} mt-5`} disabled><FileUp className="size-4" /> انتخاب فایل</button><p className="mt-3 text-xs text-muted-foreground">در این نسخه هیچ فایلی بارگذاری یا پردازش نمی‌شود.</p></div></section>

  if (feature === 'branches' || feature === 'members' || feature === 'trainers') return <section className={panel}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{feature === 'branches' ? 'شعبه‌های گروه' : feature === 'members' ? 'فهرست اعضا' : 'انتساب مربی به شاگرد'}</h2><p className="mt-1 text-sm text-muted-foreground">اطلاعات باید در محدوده tenant و مجوزهای نقش جاری فیلتر شود.</p></div><button className={action} disabled><Plus className="size-4" /> {feature === 'branches' ? 'شعبه جدید' : feature === 'members' ? 'دعوت عضو' : 'انتساب جدید'}</button></div><div className="mt-5"><Empty title="اطلاعاتی دریافت نشده است" detail={feature === 'trainers' ? 'مربی فقط سابقه تمرین شاگردان اختصاص‌یافته را می‌بیند؛ این محدودیت باید در بک‌اند نیز اعمال شود.' : 'پس از اتصال API، فهرست و عملیات مجاز برای نقش کاربر نمایش داده می‌شود.'} /></div></section>

  if (feature === 'settings') return <section className={panel}><h2 className="font-semibold">ترجیحات تمرین</h2><p className="mt-1 text-sm text-muted-foreground">تنظیمات حساب پس از اتصال API از سرور خوانده و ذخیره می‌شود.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">زبان<select className={`${field} mt-2`} disabled defaultValue="fa"><option value="fa">فارسی</option><option value="en">English</option></select></label><label className="text-sm font-medium">واحد وزن<select className={`${field} mt-2`} disabled defaultValue="kg"><option value="kg">کیلوگرم</option><option value="lb">پوند</option></select></label><label className="text-sm font-medium">شروع هفته<select className={`${field} mt-2`} disabled defaultValue="monday"><option value="monday">دوشنبه</option><option value="sunday">یکشنبه</option></select></label><label className="text-sm font-medium">استراحت پیش‌فرض<input className={`${field} mt-2`} placeholder="۹۰ ثانیه" disabled /></label></div><button className={`${action} mt-5`} disabled>ذخیره تنظیمات</button></section>

  return <section className={panel}><Empty title="اطلاعاتی برای نمایش وجود ندارد" detail="پس از اتصال API، این بخش با داده‌های واقعی tenant جاری نمایش داده می‌شود." /></section>
}

export function GymFeaturePage({ feature }: { feature: GymFeatureKey }) {
  const item = features[feature]
  const Icon = item.icon

  return (
    <main dir="rtl" className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="rounded-full bg-primary/10 px-3 py-1">{item.eyebrow}</span>
            <span className="text-muted-foreground">فضای اختصاصی گروه باشگاهی</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground sm:self-auto">
          <span className="size-2 rounded-full bg-amber-500" />
          اتصال API در انتظار پیکربندی
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-start gap-4 border-b p-5 sm:p-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold">آماده اتصال به سرویس .NET</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                این صفحه به قراردادهای تایپ‌شده بخش Gym متکی است. تا زمان اتصال پیاده‌سازی API، داده نمونه نمایش داده نمی‌شود و هیچ اطلاعاتی به‌صورت ساختگی تولید نخواهد شد.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">سرویس هنوز متصل نیست</p>
                <p className="text-sm leading-6 text-muted-foreground">پس از دریافت بک‌اند شما، متدهای API به endpointهای واقعی نگاشت می‌شوند. در حال حاضر عملیات خواندن و نوشتن غیرفعال است.</p>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">قابلیت‌های این بخش</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm leading-6">
                    <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-semibold">قراردادهای موردنیاز</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">متدهای رابطی که این صفحه برای دریافت و تغییر داده به آن‌ها نیاز دارد.</p>
            <ul className="mt-4 space-y-2">
              {item.apiMethods.map((method) => (
                <li key={method} className="rounded-lg border bg-background px-3 py-2 font-mono text-xs" dir="ltr">{method}()</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="font-semibold">محدودیت دسترسی</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              داده‌ها باید با tenant جاری و مجوز کاربر احراز هویت‌شده فیلتر شوند. مربی فقط به اطلاعات شاگردان اختصاص‌یافته دسترسی خواهد داشت؛ کنترل نهایی این مجوز باید در بک‌اند اعمال شود.
            </p>
          </div>
        </aside>
      </section>

      <WorkspacePreview feature={feature} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <span>رسانه تمرین: فقط URL ارائه‌شده از سمت API؛ در نبود رسانه، جای‌نگهدار خالی نمایش داده می‌شود.</span>
        <Link href="/" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
          بازگشت به داشبورد <ArrowUpLeft className="size-4" />
        </Link>
      </div>
    </main>
  )
}
