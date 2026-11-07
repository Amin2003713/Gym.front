import * as React from 'react'

import {
  Activity,
  BookOpen,
  CalendarCheck,
  ChartNoAxesCombined,
  ClipboardList,
  Dumbbell,
  LifeBuoy,
  LockKeyhole,
  MessagesSquare,
  Radio,
  Settings2,
  ShieldCheck,
  Users,
  Wallet,
} from '@/components/icons'
import { SidebarItem } from '@/components/ui/sidebar'
import { ApiUserRole } from '@/features/users/api/users-api'

/**
 * Menu access is declared here, once. A section is only rendered when the signed-in user has one
 * of its roles; a link without its own `role` inherits the section's.
 *
 * The menu is deliberately flat (no nested collapsibles): two levels of chevrons hid half of the
 * console behind closed groups and made items impossible to scan. Sections are short and labelled.
 */
const STAFF_ROLES: ApiUserRole[] = [ApiUserRole.Admin, ApiUserRole.Trainer]
const ADMIN_ROLES: ApiUserRole[] = [ApiUserRole.Admin]

type SidebarSection = {
  title: string
  role: ApiUserRole[]
  items: SidebarItem[]
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'فضای کار',
    role: STAFF_ROLES,
    items: [
      {
        name: 'داشبورد باشگاه',
        path: '/',
        icon: <Activity className="size-[18px]" />,
        colorClass: 'text-primary',
        role: STAFF_ROLES,
      },
      {
        name: 'میزبانی کلاس زنده',
        path: '/console/live-console',
        icon: <Radio className="size-[18px]" />,
        colorClass: 'text-primary',
        role: STAFF_ROLES,
      },
      {
        name: 'ورود به کلاس',
        path: '/live',
        icon: <Users className="size-[18px]" />,
        colorClass: 'text-primary',
        role: STAFF_ROLES,
      },
    ],
  },
  {
    title: 'تمرین و برنامه',
    role: STAFF_ROLES,
    items: [
      {
        name: 'برنامه‌ریزی تمرین',
        path: '/plans',
        icon: <BookOpen className="size-[18px]" />,
        colorClass: 'text-primary',
        role: STAFF_ROLES,
      },
      {
        name: 'کتابخانه حرکات',
        path: '/exercises',
        icon: <Dumbbell className="size-[18px]" />,
        colorClass: 'text-primary',
        role: STAFF_ROLES,
      },
      {
        name: 'تخصیص برنامه',
        path: '/assignments',
        icon: <CalendarCheck className="size-[18px]" />,
        colorClass: 'text-primary',
        role: STAFF_ROLES,
      },
      {
        name: 'پیگیری پیشرفت شاگرد',
        path: '/trainers/overview',
        icon: <ChartNoAxesCombined className="size-[18px]" />,
        colorClass: 'text-primary',
        role: STAFF_ROLES,
      },
    ],
  },
  {
    title: 'اعضا و پشتیبانی',
    role: STAFF_ROLES,
    items: [
      {
        name: 'اعضای باشگاه',
        path: '/members',
        icon: <Users className="size-[18px]" />,
        colorClass: 'text-[var(--brand-slate)]',
      },
      {
        name: 'مربی‌ها و شاگردها',
        path: '/trainers',
        icon: <ShieldCheck className="size-[18px]" />,
        colorClass: 'text-[var(--brand-slate)]',
      },
      {
        name: 'صف مربی',
        path: '/console/coach',
        icon: <MessagesSquare className="size-[18px]" />,
        colorClass: 'text-[var(--brand-slate)]',
      },
      {
        name: 'مرکز پشتیبانی',
        path: '/support-desk',
        icon: <LifeBuoy className="size-[18px]" />,
        colorClass: 'text-[var(--brand-slate)]',
      },
      {
        name: 'مدیریت کاربران',
        path: '/users',
        icon: <ClipboardList className="size-[18px]" />,
        colorClass: 'text-[var(--brand-slate)]',
        role: ADMIN_ROLES,
      },
    ],
  },
  {
    title: 'باشگاه',
    role: ADMIN_ROLES,
    items: [
      {
        name: 'مالی و اشتراک',
        path: '/billing',
        icon: <Wallet className="size-[18px]" />,
        colorClass: 'text-[var(--brand-bronze)]',
        role: ADMIN_ROLES,
      },
      {
        name: 'کمدهای هوشمند',
        path: '/lockers',
        icon: <LockKeyhole className="size-[18px]" />,
        colorClass: 'text-[var(--brand-bronze)]',
        role: ADMIN_ROLES,
      },
      {
        name: 'تنظیمات باشگاه',
        path: '/console/settings',
        icon: <Settings2 className="size-[18px]" />,
        colorClass: 'text-[var(--brand-bronze)]',
        role: ADMIN_ROLES,
      },
    ],
  },
]

export { ADMIN_ROLES, SIDEBAR_SECTIONS, STAFF_ROLES }
export type { SidebarSection }
