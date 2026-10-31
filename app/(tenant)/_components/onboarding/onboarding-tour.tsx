'use client'

import { HelpCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Shepherd from 'shepherd.js'

import { Button } from '@/components/ui/button'
import { useUserRoles } from '@/hooks/use-user-roles'

import 'shepherd.js/dist/css/shepherd.css'

type TourStep = {
  id: string
  title: string
  text: string
  selector?: string
}

type RoleKey = 'member' | 'coach' | 'console'

/** One tour per role. A step without a selector is shown centred (feature that has no sidebar link). */
const ROLE_STEPS: Record<RoleKey, TourStep[]> = {
  member: [
    { id: 'home', title: 'خانه', text: 'خلاصه هفته، زنجیره تمرین و آخرین اندازه‌گیری‌ات اینجاست.', selector: '[data-slot="member-shell"]' },
    { id: 'plan', title: 'برنامه من', text: 'روزهای برنامه مربی و درصد پیشرفت هر برنامه را ببین.', selector: 'a[href="/plan"]' },
    { id: 'workout', title: 'تمرین', text: 'جلسه بعدی را شروع کن؛ هر حرکت یک مرحله است با ویدیو، دستورالعمل و ثبت ست.', selector: 'a[href="/workout"]' },
    { id: 'library', title: 'کتابخانه حرکات', text: 'حرکت‌ها را با جستجو و فیلتر عضله پیدا کن و جزئیاتشان را ببین.', selector: 'a[href="/library"]' },
    { id: 'muscles', title: 'نقشه عضلات', text: 'بار تمرین و ریکاوری هر عضله را روی نقشه بدن ببین.', selector: 'a[href="/muscles"]' },
    { id: 'stats', title: 'آمار', text: 'حجم، ست و روند پیشرفتت از جلسات ثبت‌شده ساخته می‌شود.', selector: 'a[href="/stats"]' },
    { id: 'measurements', title: 'اندازه‌گیری', text: 'وزن، دورها، خواب و ضربان استراحت را ثبت کن تا گزارش دقیق‌تر شود.', selector: 'a[href="/measurements"]' },
    { id: 'coach', title: 'مربی', text: 'سؤال تمرینی را از مربی هوشمند بپرس یا برای بازبینی برنامه به مربی باشگاه بفرست.', selector: 'a[href="/coach"]' },
    { id: 'locker', title: 'کمد من', text: 'جای کمدت را روی نقشه اتاق رختکن پیدا کن.', selector: 'a[href="/locker"]' },
    { id: 'support', title: 'پشتیبانی', text: 'درخواست پشتیبانی ثبت کن و پاسخ‌ها را در همان گفتگو ببین.', selector: 'a[href="/support"]' },
    { id: 'settings', title: 'تنظیمات', text: 'واحدها، اعلان‌ها و ظاهر برنامه را از اینجا تغییر بده.', selector: 'a[href="/settings"]' },
    { id: 'more', title: 'منوی حساب', text: 'این منو همه بخش‌های جانبی را دارد؛ هر وقت خواستی راهنما را از همین‌جا دوباره باز کن.', selector: 'button[aria-label="منوی حساب"], [data-slot="member-shell"] header button' },
  ],
  coach: [
    { id: 'home', title: 'پنل مربی', text: 'درخواست‌های باز، شاگردان و راه‌های ورود به تمرین در یک نگاه.', selector: '[data-slot="console-layout"]' },
    { id: 'queue', title: 'صف مربی', text: 'درخواست‌های انسانی اعضا؛ بازها اول و پاسخ در همان صفحه.', selector: 'a[href="/console/coach"]' },
    { id: 'report', title: 'گزارش مربی', text: 'یک شاگرد را انتخاب کن تا برنامه، بار عضلانی، ریکاوری و اندازه‌گیری‌هایش را ببینی.', selector: 'a[href="/trainers/overview"]' },
    { id: 'members', title: 'اعضا', text: 'اعضای باشگاه و وضعیت عضویتشان را مدیریت کن.', selector: 'a[href="/members"]' },
    { id: 'plans', title: 'برنامه‌ها', text: 'برنامه تمرینی بساز یا برنامه‌های موجود را ویرایش کن.', selector: 'a[href="/plans"]' },
    { id: 'assignments', title: 'تخصیص‌ها', text: 'برنامه را به شاگرد اختصاص بده و وضعیت اجرا را پیگیری کن.', selector: 'a[href="/assignments"]' },
    { id: 'workouts', title: 'حالت تمرین', text: 'مثل یک عضو، جلسه را اجرا کن و ست ثبت کن؛ برای آزمایش برنامه‌های خودت مفید است.', selector: 'a[href="/workouts"]' },
    { id: 'support', title: 'مرکز پشتیبانی', text: 'درخواست‌های پشتیبانی اعضا را بررسی و پاسخ بده.', selector: 'a[href="/support-desk"]' },
    { id: 'profile', title: 'پروفایل', text: 'اطلاعات حساب و تصویر پروفایل را ویرایش کن.', selector: 'a[href="/console/profile"]' },
  ],
  console: [
    { id: 'home', title: 'داشبورد باشگاه', text: 'وضعیت باشگاه، درخواست‌ها و میانبرهای مدیریت.', selector: '[data-slot="console-layout"]' },
    { id: 'members', title: 'اعضا', text: 'اعضا را ببین، نقش بده و وضعیت عضویت را مدیریت کن.', selector: 'a[href="/members"]' },
    { id: 'trainers', title: 'مربی‌ها و شاگردها', text: 'حساب مربی بساز و شاگردها را به او نسبت بده.', selector: 'a[href="/trainers"]' },
    { id: 'report', title: 'گزارش مربی', text: 'گزارش پیشرفت، بار عضلانی و ریکاوری هر عضو برای کوچینگ.', selector: 'a[href="/trainers/overview"]' },
    { id: 'queue', title: 'صف مربی', text: 'درخواست‌های اعضا از مربیان را ببین و پاسخ بده.', selector: 'a[href="/console/coach"]' },
    { id: 'plans', title: 'برنامه‌ها', text: 'برنامه‌های تمرینی باشگاه را بساز و منتشر کن.', selector: 'a[href="/plans"]' },
    { id: 'assignments', title: 'تخصیص برنامه', text: 'برنامه مناسب را به اعضا اختصاص بده.', selector: 'a[href="/assignments"]' },
    { id: 'workouts', title: 'حالت تمرین', text: 'وارد تجربه تمرین شو و مثل یک عضو باشگاه تمرین کن.', selector: 'a[href="/workouts"]' },
    { id: 'lockers', title: 'کمدهای هوشمند', text: 'اتاق‌ها، نقشه کمدها و تخصیص‌ها را مدیریت کن.', selector: 'a[href="/lockers"]' },
    { id: 'billing', title: 'مالی و اشتراک', text: 'محصولات، اشتراک‌ها و پرداخت‌های اعضا.', selector: 'a[href="/billing"]' },
    { id: 'support', title: 'مرکز پشتیبانی', text: 'درخواست‌های پشتیبانی را بررسی و پاسخ بده.', selector: 'a[href="/support-desk"]' },
    { id: 'users', title: 'مدیریت کاربران', text: 'حساب‌ها، نقش‌ها و دسترسی‌ها.', selector: 'a[href="/users"]' },
    { id: 'settings', title: 'تنظیمات باشگاه', text: 'نام، برند و قواعد باشگاه را ویرایش کن.', selector: 'a[href="/console/settings"]' },
  ],
}

const storageKey = (role: RoleKey) => `hamowj-tour-${role}-completed`

/** Custom event so a menu item or a settings button can re-open the guide. */
export const START_TOUR_EVENT = 'hamowj:start-tour'

export function OnboardingTour() {
  const { isAdmin, isTrainer } = useUserRoles()

  const role = useMemo<RoleKey>(
    () => (isAdmin ? 'console' : isTrainer ? 'coach' : 'member'),
    [isAdmin, isTrainer],
  )

  const [ready, setReady] = useState(false)
  const activeTour = useRef<{ cancel: () => void } | null>(null)

  const startTour = useCallback(() => {
    activeTour.current?.cancel()
    activeTour.current = null

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'hamowj-shepherd',
        scrollTo: { behavior: 'smooth', block: 'center' },
      },
    })

    const steps = ROLE_STEPS[role]

    steps.forEach((step, index) => {
      const target = step.selector ? document.querySelector(step.selector) : null
      const isLast = index === steps.length - 1
      const isFirst = index === 0

      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        ...(target
          ? { attachTo: { element: target as HTMLElement, on: index % 2 === 0 ? 'bottom' : 'top' } }
          : {}),
        buttons: [
          ...(isFirst
            ? []
            : [
                {
                  text: 'قبلی',
                  action() {
                    tour.back()
                  },
                  classes: 'shepherd-button-secondary',
                },
              ]),
          {
            text: isLast ? 'پایان راهنما' : 'بعدی',
            action() {
              if (isLast) tour.complete()
              else tour.next()
            },
          },
          {
            text: 'خروج',
            action() {
              tour.cancel()
            },
            classes: 'shepherd-button-secondary',
          },
        ],
      })
    })

    tour.on('complete', () => localStorage.setItem(storageKey(role), '1'))
    tour.on('cancel', () => localStorage.setItem(storageKey(role), '1'))

    activeTour.current = tour
    void tour.start()
  }, [role])

  useEffect(() => {
    setReady(true)
  }, [])

  // First visit of each role: start once, after the shell has painted its links.
  useEffect(() => {
    if (!ready || localStorage.getItem(storageKey(role))) return

    const timer = window.setTimeout(startTour, 800)
    return () => window.clearTimeout(timer)
  }, [ready, role, startTour])

  // A menu entry (or any button) can re-open the guide through this event.
  useEffect(() => {
    const handler = () => startTour()
    window.addEventListener(START_TOUR_EVENT, handler)
    return () => window.removeEventListener(START_TOUR_EVENT, handler)
  }, [startTour])

  useEffect(() => () => activeTour.current?.cancel(), [])

  if (!ready) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="bg-background fixed bottom-5 left-5 z-40 size-11 rounded-full shadow-lg"
      aria-label="راهنمای سریع"
      title="راهنمای سریع"
      onClick={startTour}
    >
      <HelpCircle className="size-5" />
    </Button>
  )
}
