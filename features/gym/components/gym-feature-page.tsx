'use client'

import {
  Activity,
  ArrowUpLeft,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Dumbbell,
  FileUp,
  GitBranch,
  History,
  Settings2,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExerciseLibrary } from './exercise-library'
import { OpenGymWorkspace } from './open-gym-workspace'

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
  if (feature === 'exercises') return <ExerciseLibrary />
  return <OpenGymWorkspace feature={feature} />
}

export function GymFeaturePage({ feature }: { feature: GymFeatureKey }) {
  const pathname = usePathname()
  const tenantBase = `/tenants/${pathname.split('/').filter(Boolean)[1] ?? ''}`
  const item = features[feature]
  const Icon = item.icon

  return (
    <main dir="rtl" className="mx-auto w-full max-w-[1440px] space-y-5 p-3 sm:p-5 lg:p-7">
      <header className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -left-12 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="rounded-full bg-primary/10 px-3 py-1">{item.eyebrow}</span>
              <span className="text-muted-foreground">فضای اختصاصی گروه باشگاهی</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{item.description}</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground sm:self-auto">
            <span className={`size-2 rounded-full ${feature === 'exercises' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {feature === 'exercises' ? 'اتصال API حرکات پیاده‌سازی شده' : 'رابط تعاملی · اتصال داده در انتظار API'}
          </div>
        </div>
      </header>

      {feature === 'exercises' ? <ExerciseLibrary /> : <WorkspacePreview feature={feature} />}

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <span>رسانه تمرین: فقط URL ارائه‌شده از سمت API؛ در نبود رسانه، جای‌نگهدار خالی نمایش داده می‌شود.</span>
        <Link href={tenantBase} className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
          بازگشت به داشبورد <ArrowUpLeft className="size-4" />
        </Link>
      </footer>
    </main>
  )
}
