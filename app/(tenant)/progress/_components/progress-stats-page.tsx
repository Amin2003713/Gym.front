'use client'

import {
  Activity,
  Award,
  CalendarDays,
  Dumbbell,
  Flame,
  Info,
  MessageCircleWarning,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useFigureGender } from '@/hooks/use-figure-gender'
import { MUSCLES, MuscleSlug } from '@/lib/muscles'

import {
  useMuscleBalance,
  type BalanceRangeKey,
} from '../_api/use-muscle-balance'
import {
  coachRows,
  loadLevels,
  recoveryLevels,
  type CoachRow,
  type WorkoutMuscleStats,
  MuscleUse,
} from '../_model/muscle-balance'

import BodyMapPanel from './body-map-panel'
import CoachReportTable from './coach-report-table'
import OverviewTab from './overview-tab'

const fa = (n: number) => n.toLocaleString('fa-IR')

/** Persian display names for the body-map slugs. */
export const MUSCLE_LABEL: Record<string, string> = {
  trapezius: 'ذوزنقه‌ای',
  deltoids: 'سرشانه',
  chest: 'سینه',
  'upper-back': 'پشت فوقانی',
  serratus: 'دندانه‌ای',
  biceps: 'جلو بازو',
  triceps: 'پشت بازو',
  forearm: 'ساعد',
  abs: 'شکم',
  obliques: 'مورب شکمی',
  'lower-back': 'کمر',
  gluteal: 'باسن',
  quadriceps: 'چهارسر ران',
  hamstring: 'همسترینگ',
  adductors: 'داخل ران',
  'hip-flexors': 'خم‌کننده لگن',
  calves: 'ساق پا',
  tibialis: 'جلوی ساق',
}

const RANGE_OPTIONS: Array<{ key: BalanceRangeKey; label: string }> = [
  { key: '7', label: '۷ روز' },
  { key: '30', label: '۳۰ روز' },
  { key: '90', label: '۹۰ روز' },
  { key: 'all', label: 'همه' },
]

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--popover-foreground)',
  boxShadow: '0 12px 32px rgb(0 0 0 / 12%)',
  fontSize: 12,
}

function Panel({
  title,
  description,
  badge,
  children,
}: {
  title: string
  description?: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-card overflow-hidden rounded-lg border shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div>
          <h2 className="font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {description}
            </p>
          )}
        </div>
        {badge && (
          <span className="text-muted-foreground rounded-full border px-3 py-1 text-xs font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

type TabKey = 'overview' | 'muscles' | 'coach'

const tabs: Array<{ key: TabKey; label: string; icon: typeof Activity }> = [
  { key: 'overview', label: 'نمای کلی', icon: Activity },
  { key: 'muscles', label: 'موازنه عضلات', icon: Dumbbell },
  { key: 'coach', label: 'گزارش مربی', icon: Target },
]

function RealNotice() {
  return (
    <p className="text-muted-foreground mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs leading-5">
      <Info className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      این صفحه به API واقعی تمرین وصل است؛ آمار از جلسات ثبت‌شده ساخته می‌شود.
      مقادیر enum نیز عددی ارسال و دریافت می‌شوند.
    </p>
  )
}

export function ProgressStatsPage() {
  const [active, setActive] = useState<TabKey>('overview')
  const { sessions, stats, loading, error, range, setRange, refetch } =
    useMuscleBalance()
  const figureGender = useFigureGender()

  // Captured once per mount so the memo stays pure; minute-level drift is irrelevant.
  const [nowMs] = useState(() => Date.now())

  const payload = useMemo(() => {
    const perMuscle = Object.fromEntries(
      MUSCLES.map((slug) => [
        slug,
        stats?.perMuscle?.[slug] ?? {
          primarySets: 0,
          secondarySets: 0,
          volumeKg: 0,
          sessions: 0,
        },
      ]),
    ) as Record<MuscleSlug, MuscleUse>

    return {
      loadLevels: loadLevels(perMuscle),
      recovery: recoveryLevels(perMuscle, nowMs),
      rows: coachRows(perMuscle, nowMs),
    }
  }, [stats, nowMs])

  return (
    <main
      dir="rtl"
      className="mx-auto w-full max-w-[1500px] space-y-5 p-3 sm:p-5 lg:p-7"
    >
      <header className="bg-card relative overflow-hidden rounded-lg border p-5 shadow-sm sm:p-7">
        <div className="bg-primary/10 pointer-events-none absolute -top-16 -left-10 size-48 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
              <TrendingUp className="size-3.5" /> آمار و پیشرفت
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              مرکز تحلیل تمرین
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-7">
              حجم تمرین، کارکرد هر عضله بر اساس تاریخچه واقعی، وضعیت ریکاوری و
              گزارش کاربردی برای مربی — همه از جلسات ثبت‌شده در API تمرین.
            </p>
          </div>
          <label className="bg-background/80 text-muted-foreground inline-flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-xs sm:self-auto">
            بازه زمانی
            <select
              className="bg-background h-8 rounded-lg border px-2 text-xs"
              value={range}
              onChange={(e) => setRange(e.target.value as BalanceRangeKey)}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={refetch}
              className="hover:bg-muted rounded-lg border px-2 py-1 text-xs font-semibold"
              disabled={loading}
            >
              بروزرسانی
            </button>
          </label>
        </div>
      </header>

      <div className="bg-card flex gap-2 overflow-x-auto rounded-lg border p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm"
        >
          {error}
        </div>
      )}

      {active === 'overview' && (
        <OverviewTab sessions={sessions} stats={stats} loading={loading} />
      )}

      {active === 'muscles' && (
        <MusclesBalanceTab
          stats={stats}
          loading={loading}
          figureGender={figureGender}
          loadLevels={payload.loadLevels}
          recovery={payload.recovery}
        />
      )}

      {active === 'coach' && (
        <CoachTab
          rows={payload.rows}
          stats={stats}
          figureGender={figureGender}
          loadLevels={payload.loadLevels}
        />
      )}

      <footer className="text-muted-foreground flex flex-wrap items-start gap-2 rounded-lg border border-dashed px-4 py-3 text-xs leading-5">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          الگوی آمار از openGym؛ نقشه عضلات به رنگ سبز (کارکرد)، آبی (ریکاوری) و
          قرمز (کمبود ریکاوری) از تاریخچه واقعی ساخته می‌شود. نمای بدن بر اساس
          جنسیت ثبت‌شده در پروفایل انتخاب می‌شود.
        </span>
      </footer>
    </main>
  )
}

/* ------------------------------- muscles tab ------------------------------- */

function MusclesBalanceTab({
  stats,
  loading,
  figureGender,
  loadLevels,
  recovery,
}: {
  stats: WorkoutMuscleStats
  loading: boolean
  figureGender: 'male' | 'female'
  loadLevels: Record<string, number>
  recovery: ReturnType<typeof recoveryLevels>
}) {
  const [mapTab, setMapTab] = useState<'trained' | 'recovery'>('trained')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      Object.keys(loadLevels)
        .map((slug) => slug as MuscleSlug)
        .map((slug) => ({
          slug,
          sets:
            stats.perMuscle[slug]?.primarySets +
              stats.perMuscle[slug]?.secondarySets || 0,
          pct: recovery.pcts[slug]?.pct ?? 100,
          recovery:
            mapTab === 'recovery' ? recovery.levels[slug] : loadLevels[slug],
        }))
        .sort((a, b) =>
          mapTab === 'recovery' ? a.pct - b.pct : b.sets - a.sets,
        ),
    [loadLevels, stats, mapTab, recovery],
  )

  const anyData =
    !loading && Object.values(loadLevels).some((level) => level > 0)

  return (
    <div className="space-y-5">
      <Panel
        title="نقشه بدن"
        description={
          mapTab === 'trained'
            ? 'هرچه بیشتر تمرین شده، سبزتر.'
            : 'شمش: عضله استراحت کافی داشته — قرمز: تازه تمرین شده و ریکاوری کافی هنوز اتفاق نیفتاده.'
        }
        badge={
          figureGender === 'female'
            ? 'نمای زنانه · از پروفایل'
            : 'نمای مردانه · از پروفایل'
        }
      >
        <div className="mb-4 flex gap-2">
          {(['trained', 'recovery'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setMapTab(key)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${mapTab === key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {key === 'trained' ? 'کارکرد' : 'ریکاوری'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-muted-foreground flex min-h-56 items-center justify-center text-sm">
            در حال محاسبه از تاریخچه واقعی…
          </div>
        ) : (
          <>
            <BodyMapPanel
              body={figureGender}
              palette={mapTab === 'trained' ? 'load' : 'recovery'}
              load={mapTab === 'trained' ? loadLevels : recovery.levels}
              selected={selectedSlug ?? undefined}
              onMuscle={setSelectedSlug}
            />
            {mapTab === 'recovery' && (
              <div className="text-muted-foreground mt-3 text-xs">
                {selectedSlug && (
                  <span className="text-foreground mr-2 font-semibold">
                    {MUSCLE_LABEL[selectedSlug] ?? selectedSlug}:{' '}
                    {fa(Math.round(recovery.pcts[selectedSlug]?.pct ?? 100))}٪
                    ریکاوری شده
                  </span>
                )}
                <span>روی عضله کلیک کنید تا درصد ریکاوری دیده شود.</span>
              </div>
            )}
          </>
        )}

        {!anyData && !loading && (
          <p className="text-muted-foreground mt-3 text-xs">
            هنوز جلسه‌ای در این بازه ثبت نشده است؛ نقشه با رنگ خنثی (بدون داده)
            است.
          </p>
        )}
        <RealNotice />
      </Panel>

      <Panel
        title={
          mapTab === 'trained' ? 'حجم کارکرد هر عضله' : 'وضعیت ریکاوری هر عضله'
        }
        description={
          mapTab === 'trained'
            ? 'ست‌های ثبت‌شده در بازه انتخابی'
            : 'درصد استراحت تکمیل‌شده پس از آخرین جلسه'
        }
      >
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.slug}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">
                  {MUSCLE_LABEL[row.slug] ?? row.slug}
                </span>
                <span className="text-muted-foreground text-xs">
                  {mapTab === 'trained'
                    ? `${fa(row.sets)} ست`
                    : row.sets === 0
                      ? 'بدون تمرین — بدنه آماده'
                      : `${fa(Math.round(row.pct))}٪ ریکاوری`}
                </span>
              </div>
              <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                {mapTab === 'trained' ? (
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(row.recovery / 4) * 100}%` }}
                  />
                ) : (
                  <div
                    className={`h-full rounded-full transition-all ${row.recovery >= 2 ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${row.pct}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* -------------------------------- coach tab -------------------------------- */

function CoachTab({
  rows,
  stats,
  figureGender,
  loadLevels,
}: {
  rows: CoachRow[]
  stats: WorkoutMuscleStats
  figureGender: 'male' | 'female'
  loadLevels: Record<string, number>
}) {
  const toFocus = rows.filter((row) => row.suggestion === 'add-here')
  const toRest = rows.filter(
    (row) => row.suggestion === 'needs-rest' || row.suggestion === 'ease-off',
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">جلسات بازه</p>
          <p className="mt-2 text-2xl font-extrabold">
            {fa(stats.totals.sessions)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">ست‌های مؤثر</p>
          <p className="mt-2 text-2xl font-extrabold">
            {fa(stats.totals.sets)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">حجم کل</p>
          <p className="mt-2 text-2xl font-extrabold">
            {fa(Math.round(stats.totals.volumeKg))}{' '}
            <span className="text-base">kg</span>
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">حرکات بدون شناسه عضله</p>
          <p className="mt-2 text-2xl font-extrabold">
            {fa(stats.unmatchedExerciseIds.length)}
          </p>
        </div>
      </div>

      <Panel
        title="خلاصه برای مربی"
        description="پیشنهاد خودکار از کارکرد و ریکاوری — برای طراحی برنامه تمرینی عضو"
      >
        <strong className="block">
          <span className="inline-flex items-center gap-1.5">
            <Info className="size-4" /> پانل نقشه عضله (برای اعضا، هنگام
            ساخت/اختصاص برنامه):
          </span>
        </strong>
        <ul className="mt-2 space-y-2 text-sm leading-7">
          <li className="flex items-start gap-2">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
            عضلات با کارکرد بالا در بازه و ریکاوری достатقی: منابع اصلی برنامه
            پیش‌رو.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-red-500" />
            عضلات تازه تمرین‌شده: تا تکمیل ریکاوری، در روزهای اول برنامه حجم
            کمتر بگذارید.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
            عضلات بی‌کارکرد در بازه: اولویت ورود حرکات جدید برای حذف نقاط ضعف.
          </li>
          <li className="flex items-start gap-2">
            <MessageCircleWarning className="text-muted-foreground mt-1 size-4 shrink-0" />
            نقشه اختصاصی عضو در گفتگوی «تخصیص برنامه به شاگردها» و در فرم عضو
            بارگذاری می‌شود.
          </li>
        </ul>
      </Panel>

      {toFocus.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel
            title="نیازمند کارکرد بیشتر"
            description="عضلات بدون ست در این بازه"
          >
            <ul className="flex flex-wrap gap-2">
              {toFocus.map((row) => (
                <li
                  key={row.slug}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400"
                >
                  {MUSCLE_LABEL[row.slug] ?? row.slug}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel
            title="نیازمند استراحت"
            description="ریکاوری کمتر از ۵۵٪ با کارکرد بالا"
          >
            <ul className="flex flex-wrap gap-2">
              {toRest.length === 0 ? (
                <li className="text-muted-foreground text-xs">
                  همه عضلات تمرین‌شده ریکاوری اصلی دارند.
                </li>
              ) : (
                toRest.map((row) => (
                  <li
                    key={row.slug}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400"
                  >
                    {MUSCLE_LABEL[row.slug] ?? row.slug} ·{' '}
                    {fa(Math.round(row.recoveryPct))}٪
                  </li>
                ))
              )}
            </ul>
          </Panel>
        </div>
      )}

      <Panel
        title="جزئیات عضلات"
        description="برای هر عضله: ست‌ها (اصلی/کمکی)، آخرین تمرین، ریکاوری و پیشنهاد"
        badge={figureGender === 'female' ? 'نمای زنانه' : 'نمای مردانه'}
      >
        <div className="rounded-lg border p-3">
          <CoachReportTable rows={rows} />
        </div>
        <div className="mt-3 flex gap-2">
          <BodyMapPanel
            body={figureGender}
            palette="load"
            load={loadLevels}
            className="max-w-md flex-1"
          />
          <div className="text-muted-foreground flex flex-col justify-center gap-2 text-xs leading-6">
            <span className="inline-flex items-center gap-1.5">
              <Dumbbell className="size-4" /> نقشه سبز: کارکرد بالاتر
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="size-4" /> بیش‌کارکردها اول با احتیاط
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flame className="size-4" /> داده از جلسات واقعی ثبت‌شده
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" /> بازه از انتخاب بالای صفحه
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer className="size-4" /> ریکاوری بر پایه تأخیر آخرین جلسه
            </span>
          </div>
        </div>
      </Panel>
    </div>
  )
}
