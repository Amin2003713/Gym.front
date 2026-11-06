'use client'

import { HelpCircle } from '@/components/icons'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { useUserRoles } from '@/hooks/use-user-roles'

import 'shepherd.js/dist/css/shepherd.css'

type TourStep = {
  id: string
  title: string
  text: string
  selector?: string
  /** Route root this step belongs to; steps without one are shown everywhere. */
  route?: string
}

type RoleKey = 'member' | 'coach' | 'console'

/** Bumping this re-runs the guide for everyone, even if they finished the previous one. */
const TOUR_VERSION = 2

/**
 * One tour per role. Member steps are route-scoped so the guide only talks about the screen the
 * member is actually on; selectors are resolved against the live DOM, and a step whose target is
 * not rendered is dropped instead of pointing at nothing.
 */
const ROLE_STEPS: Record<RoleKey, TourStep[]> = {
  member: [
    {
      id: 'home',
      route: '/home',
      title: 'خانه',
      text: 'خلاصه هفته، زنجیره تمرین و جلسه بعدی‌ات اینجاست.',
      selector: '[data-slot="member-shell"]',
    },
    {
      id: 'plan',
      route: '/plan',
      title: 'برنامه من',
      text: 'برنامه‌های فعال و عمومی را ببین و روزهای هر برنامه را باز کن.',
      selector: 'a[href="/plan"]',
    },
    {
      id: 'workout',
      route: '/workout',
      title: 'تمرین',
      text: 'هر حرکت یک مرحله است؛ ست، شدت و استراحت را همان‌جا ثبت کن.',
      selector: 'a[href="/workout"]',
    },
    {
      id: 'library',
      route: '/library',
      title: 'کتابخانه حرکات',
      text: 'حرکت‌ها را با فیلتر عضله و تجهیزات پیدا کن و جزئیاتشان را ببین.',
      selector: 'a[href="/library"]',
    },
    {
      id: 'stats',
      route: '/stats',
      title: 'آمار',
      text: 'حجم، رکوردها، استراحت و روند ماه‌های گذشته از جلسات ثبت‌شده ساخته می‌شود.',
      selector: 'a[href="/stats"]',
    },
    {
      id: 'measurements',
      route: '/measurements',
      title: 'اندازه‌گیری',
      text: 'وزن و دورها را ثبت کن؛ نمودار هر اندازه با رنگ خودش رسم می‌شود.',
      selector: 'a[href="/measurements"]',
    },
    {
      id: 'settings',
      route: '/settings',
      title: 'تنظیمات',
      text: 'ظاهر، تجهیزات، کلید عبور و راهنمای سریع از همین‌جا در دسترس‌اند.',
      selector: 'a[href="/settings"]',
    },
    {
      id: 'nav',
      title: 'همه امکانات',
      text: 'در گوشی، دکمه «همه» هر بخش دیگر را در یک صفحه باز می‌کند.',
      selector: 'button[aria-label="همه امکانات"], nav[aria-label="ناوبری اصلی"]',
    },
  ],
  coach: [
    {
      id: 'home',
      title: 'پنل مربی',
      text: 'درخواست‌های باز، شاگردان و راه‌های ورود به تمرین در یک نگاه.',
      selector: '[data-slot="console-layout"]',
    },
    {
      id: 'queue',
      title: 'صف مربی',
      text: 'درخواست‌های انسانی اعضا؛ بازها اول و پاسخ در همان صفحه.',
      selector: 'a[href="/console/coach"]',
    },
    {
      id: 'report',
      title: 'گزارش مربی',
      text: 'یک شاگرد را انتخاب کن تا برنامه، بار عضلانی، ریکاوری و اندازه‌گیری‌هایش را ببینی.',
      selector: 'a[href="/trainers/overview"]',
    },
    {
      id: 'members',
      title: 'اعضا',
      text: 'اعضای باشگاه و وضعیت عضویتشان را مدیریت کن.',
      selector: 'a[href="/members"]',
    },
    {
      id: 'plans',
      title: 'برنامه‌ها',
      text: 'برنامه تمرینی بساز یا برنامه‌های موجود را ویرایش کن.',
      selector: 'a[href="/plans"]',
    },
    {
      id: 'assignments',
      title: 'تخصیص‌ها',
      text: 'برنامه را به شاگرد اختصاص بده و وضعیت اجرا را پیگیری کن.',
      selector: 'a[href="/assignments"]',
    },
    {
      id: 'workouts',
      title: 'حالت تمرین',
      text: 'مثل یک عضو، جلسه را اجرا کن و ست ثبت کن؛ برای آزمایش برنامه‌های خودت مفید است.',
      selector: 'a[href="/home"]',
    },
    {
      id: 'support',
      title: 'مرکز پشتیبانی',
      text: 'درخواست‌های پشتیبانی اعضا را بررسی و پاسخ بده.',
      selector: 'a[href="/support-desk"]',
    },
    {
      id: 'profile',
      title: 'پروفایل',
      text: 'اطلاعات حساب و تصویر پروفایل را ویرایش کن.',
      selector: 'a[href="/console/profile"]',
    },
  ],
  console: [
    {
      id: 'home',
      title: 'داشبورد باشگاه',
      text: 'وضعیت باشگاه، درخواست‌ها و میانبرهای مدیریت.',
      selector: '[data-slot="console-layout"]',
    },
    {
      id: 'members',
      title: 'اعضا',
      text: 'اعضا را ببین، نقش بده و وضعیت عضویت را مدیریت کن.',
      selector: 'a[href="/members"]',
    },
    {
      id: 'trainers',
      title: 'مربی‌ها و شاگردها',
      text: 'حساب مربی بساز و شاگردها را به او نسبت بده.',
      selector: 'a[href="/trainers"]',
    },
    {
      id: 'report',
      title: 'گزارش مربی',
      text: 'گزارش پیشرفت، بار عضلانی و ریکاوری هر عضو برای کوچینگ.',
      selector: 'a[href="/trainers/overview"]',
    },
    {
      id: 'queue',
      title: 'صف مربی',
      text: 'درخواست‌های اعضا از مربیان را ببین و پاسخ بده.',
      selector: 'a[href="/console/coach"]',
    },
    {
      id: 'plans',
      title: 'برنامه‌ها',
      text: 'برنامه‌های تمرینی باشگاه را بساز و منتشر کن.',
      selector: 'a[href="/plans"]',
    },
    {
      id: 'assignments',
      title: 'تخصیص برنامه',
      text: 'برنامه مناسب را به اعضا اختصاص بده.',
      selector: 'a[href="/assignments"]',
    },
    {
      id: 'lockers',
      title: 'کمدهای هوشمند',
      text: 'اتاق‌ها، نقشه کمدها و تخصیص‌ها را مدیریت کن.',
      selector: 'a[href="/lockers"]',
    },
    {
      id: 'billing',
      title: 'مالی و اشتراک',
      text: 'محصولات، اشتراک‌ها و پرداخت‌های اعضا.',
      selector: 'a[href="/billing"]',
    },
    {
      id: 'settings',
      title: 'تنظیمات باشگاه',
      text: 'نام، برند و قواعد باشگاه را ویرایش کن.',
      selector: 'a[href="/console/settings"]',
    },
  ],
}

const routeRoot = (pathname: string) => {
  const segment = pathname.split('/').filter(Boolean)[0]
  return segment ? `/${segment}` : '/home'
}

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches

/** Custom event so a menu item or a settings button can re-open the guide. */
export const START_TOUR_EVENT = 'hamowj:start-tour'

export function OnboardingTour() {
  const { isAdmin, isTrainer } = useUserRoles()
  const { data: session } = useSession()
  const pathname = usePathname()

  const role = useMemo<RoleKey>(
    () => (isAdmin ? 'console' : isTrainer ? 'coach' : 'member'),
    [isAdmin, isTrainer],
  )

  // Tour state is per member and per tour version, so a new guide is offered after an upgrade
  // while a finished one never reappears uninvited.
  const userId = (session?.user as { id?: string } | undefined)?.id ?? 'anon'
  const completionKey = `hamowj-tour-v${TOUR_VERSION}:${userId}:${role}:done`
  const progressKey = `hamowj-tour-v${TOUR_VERSION}:${userId}:${role}:step`

  const activeTour = useRef<{ cancel: () => void } | null>(null)
  const autoStarted = useRef(false)

  const startTour = useCallback(async () => {
    activeTour.current?.cancel()
    activeTour.current = null

    const all = ROLE_STEPS[role]
    const scoped =
      role === 'member' ? all.filter((step) => !step.route || step.route === routeRoot(pathname)) : all

    // Keep only steps whose target is actually in the DOM (a collapsed menu, a role without that
    // route, a feature hidden by settings); a centred step without a selector is still allowed.
    const available = scoped.filter(
      (step) => !step.selector || !!document.querySelector(step.selector),
    )
    const steps = available.length > 0 ? available : all.filter((step) => !step.selector)

    if (steps.length === 0) return

    // The tour library is large and only needed once the guide is opened: fetch it on demand so
    // it stays out of the initial bundle of every tenant page.
    const { default: Shepherd } = await import('shepherd.js')

    const savedStep = (() => {
      try {
        return window.localStorage.getItem(progressKey)
      } catch {
        return null
      }
    })()

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'hamowj-shepherd',
        scrollTo: { behavior: 'smooth', block: 'center' },
      },
    })

    steps.forEach((step, index) => {
      const isLast = index === steps.length - 1
      const isFirst = index === 0

      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        ...(step.selector
          ? {
              attachTo: {
                element: step.selector,
                on: isMobileViewport() ? 'bottom' : index % 2 === 0 ? 'bottom' : 'top',
              },
            }
          : {}),
        when: {
          show: () => {
            try {
              window.localStorage.setItem(progressKey, step.id)
            } catch {
              /* Progress is a convenience; a blocked storage just means no resume. */
            }
            document
              .querySelector(step.selector ?? '')
              ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
          },
        },
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
            text: 'بعداً',
            action() {
              tour.cancel()
            },
            classes: 'shepherd-button-secondary',
          },
        ],
      })
    })

    tour.on('complete', () => {
      try {
        window.localStorage.setItem(completionKey, '1')
        window.localStorage.removeItem(progressKey)
      } catch {
        /* ignore */
      }
    })
    tour.on('cancel', () => {
      // Not completed: the saved step id keeps the guide resumable from where it stopped.
    })

    activeTour.current = tour
    void tour.start()

    if (savedStep && steps.some((step) => step.id === savedStep)) {
      window.setTimeout(() => {
        try {
          tour.show(savedStep)
        } catch {
          /* If the saved step is no longer available, the first step is already showing. */
        }
      }, 80)
    }
  }, [completionKey, pathname, progressKey, role])

  // First visit of this user + version: start once, after the shell has painted its links.
  useEffect(() => {
    if (autoStarted.current) return

    let done = false
    try {
      done = window.localStorage.getItem(completionKey) === '1'
    } catch {
      done = false
    }

    if (done) return

    autoStarted.current = true
    const timer = window.setTimeout(() => {
      void startTour()
    }, 900)
    return () => window.clearTimeout(timer)
  }, [completionKey, startTour])

  // A settings button (or any surface) can re-open the guide through this event.
  useEffect(() => {
    const handler = () => {
      void startTour()
    }
    window.addEventListener(START_TOUR_EVENT, handler)
    return () => window.removeEventListener(START_TOUR_EVENT, handler)
  }, [startTour])

  useEffect(() => () => activeTour.current?.cancel(), [])

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="bg-background fixed bottom-5 left-5 z-40 size-11 rounded-full shadow-lg"
      aria-label="راهنمای سریع"
      title="راهنمای سریع"
      onClick={() => {
        void startTour()
      }}
    >
      <HelpCircle className="size-5" />
    </Button>
  )
}
