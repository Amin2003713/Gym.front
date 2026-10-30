import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumn,
  Dumbbell,
  House,
  MessagesSquare,
  PersonStanding,
  Ruler,
  Scale,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type MemberNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

/** The member app's four tabs - shared by the desktop bar and the mobile tab bar. */
export const MEMBER_NAV: MemberNavItem[] = [
  { href: '/home', label: 'خانه', icon: House },
  { href: '/plan', label: 'برنامه', icon: CalendarDays },
  { href: '/workout', label: 'تمرین', icon: Dumbbell },
  { href: '/library', label: 'کتابخانه', icon: BookOpen },
]

/** Secondary destinations - too many for the tab bar, so they live in the account menu. */
export const MEMBER_MORE: MemberNavItem[] = [
  { href: '/muscles', label: 'عضلات', icon: PersonStanding },
  { href: '/stats', label: 'آمار', icon: ChartNoAxesColumn },
  { href: '/structural-balance', label: 'تعادل ساختاری', icon: Scale },
  { href: '/measurements', label: 'اندازه‌گیری', icon: Ruler },
  { href: '/coach', label: 'مربی', icon: MessagesSquare },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
]

export const isMemberPathActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)
