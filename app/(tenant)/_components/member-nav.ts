import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumn,
  CreditCard,
  Dumbbell,
  House,
  Image as ImageIcon,
  LockKeyhole,
  MessagesSquare,
  LifeBuoy,
  PersonStanding,
  Ruler,
  Scale,
  Settings,
  UserRoundPen,
  type LucideIcon,
} from 'lucide-react'

export type MemberNavItem = {
  href: string
  label: string
  /** Tab-bar label for the five daily routes; the sidebar keeps the full name. */
  shortLabel?: string
  icon: LucideIcon
}

/**
 * The member app's primary tabs - shared by the desktop sidebar and the mobile tab bar.
 * Statistics belongs here: it is the screen members open most often after finishing a session.
 */
export const MEMBER_NAV: MemberNavItem[] = [
  { href: '/home', label: 'خانه', icon: House },
  { href: '/plan', label: 'برنامه', icon: CalendarDays },
  { href: '/workout', label: 'تمرین', icon: Dumbbell },
  { href: '/library', label: 'کتابخانه', shortLabel: 'حرکات', icon: BookOpen },
  { href: '/stats', label: 'آمار', icon: ChartNoAxesColumn },
]

/** Secondary destinations - too many for the tab bar, so they live in the account menu. */
export const MEMBER_MORE: MemberNavItem[] = [
  { href: '/profile', label: 'پروفایل من', icon: UserRoundPen },
  { href: '/locker', label: 'کمد من', icon: LockKeyhole },
  { href: '/membership', label: 'اشتراک', icon: CreditCard },
  { href: '/muscles', label: 'عضلات', icon: PersonStanding },
  { href: '/structural-balance', label: 'تعادل ساختاری', icon: Scale },
  { href: '/measurements', label: 'اندازه‌گیری', icon: Ruler },
  { href: '/progress-photos', label: 'عکس پیشرفت', icon: ImageIcon },
  { href: '/coach', label: 'مربی', icon: MessagesSquare },
  { href: '/support', label: 'پشتیبانی', icon: LifeBuoy },
  { href: '/contact', label: 'ارتباط با ما', icon: LifeBuoy },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
]

export const isMemberPathActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)
