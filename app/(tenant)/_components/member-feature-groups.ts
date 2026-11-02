import { MEMBER_MORE, MEMBER_NAV, type MemberNavItem } from './member-nav'

export type MemberFeatureGroup = {
  key: string
  label: string
  items: MemberNavItem[]
}

const byHref = new Map<string, MemberNavItem>(
  [...MEMBER_NAV, ...MEMBER_MORE].map((item) => [item.href, item]),
)

const pick = (hrefs: string[]) =>
  hrefs
    .map((href) => byHref.get(href))
    .filter((item): item is MemberNavItem => !!item)

/**
 * Every member destination, grouped for the "all features" sheet and the desktop sidebar.
 * The tab bar keeps the five daily routes; everything else stays one tap away here.
 */
export const MEMBER_FEATURE_GROUPS: MemberFeatureGroup[] = [
  {
    key: 'training',
    label: 'تمرین',
    items: pick(['/home', '/plan', '/workout', '/library', '/stats']),
  },
  {
    key: 'insight',
    label: 'تحلیل و پیشرفت',
    items: pick(['/muscles', '/structural-balance', '/measurements', '/progress-photos']),
  },
  {
    key: 'gym',
    label: 'باشگاه',
    items: pick(['/coach', '/support', '/contact', '/locker', '/membership']),
  },
  {
    key: 'account',
    label: 'حساب',
    items: pick(['/profile', '/settings']),
  },
]
