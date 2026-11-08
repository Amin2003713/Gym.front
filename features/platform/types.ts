export type SiteSettings = {
  brandName: string
  tagline: string | null
  heroEyebrow: string
  heroTitle: string
  heroHighlight: string | null
  heroSubtitle: string | null
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string | null
  secondaryCtaHref: string | null
  proof: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactAddress: string | null
  instagramUrl: string | null
  telegramUrl: string | null
  footerNote: string | null
  metaTitle: string
  metaDescription: string | null
  metaKeywords: string | null
  canonicalBaseUrl: string | null
  ogImageUrl: string | null
  googleSiteVerification: string | null
  bingSiteVerification: string | null
  allowIndexing: boolean
  updatedAtUtc: string
  updatedBy: string | null
}

export type SiteFeature = {
  id: number
  title: string
  description: string
  icon: string
  sortOrder: number
  isActive: boolean
}

export type SiteFaq = {
  id: number
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
}

export type PlatformPlan = {
  id: string | null
  code: string
  name: string
  description: string | null
  monthlyPriceToman: number
  yearlyPriceToman: number
  features: string[]
  isPopular: boolean
  isActive: boolean
  sortOrder: number
  tenantPlan: number
}

export type CmsPageSummary = {
  slug: string
  title: string
  summary: string | null
  showInFooter: boolean
}

export type SitePayload = {
  settings: SiteSettings
  features: SiteFeature[]
  faqs: SiteFaq[]
  plans: PlatformPlan[]
  pages: CmsPageSummary[]
  baseDomain: string
}

export type CmsPage = {
  id: string | null
  slug: string
  title: string
  summary: string | null
  body: string | null
  metaTitle: string | null
  metaDescription: string | null
  isPublished: boolean
  showInFooter: boolean
  sortOrder: number
  updatedAtUtc: string | null
}

export type Order = {
  id: string
  planCode: string
  planName: string
  billingCycle: number
  amountToman: number
  gymName: string
  requestedSlug: string
  ownerFirstName: string
  ownerLastName: string
  phoneNumber: string
  email: string | null
  status: number
  tenantIdentifier: string | null
  portalUrl: string | null
  failureReason: string | null
  paymentReference: string | null
  createdAtUtc: string
  paidAtUtc: string | null
}

export type TenantAdmin = {
  id: string
  identifier: string
  name: string | null
  status: number
  plan: number
  host: string | null
  createdAtUtc: string
  trialEndsAtUtc: string | null
  contractRenewsAtUtc: string | null
}

export type Overview = {
  tenants: number
  trialTenants: number
  activeTenants: number
  orders: number
  awaitingPaymentOrders: number
  paidRevenueToman: number
  recentOrders: Order[]
}

export type AdminAccount = {
  id: string
  email: string
  userName: string
  displayName: string
  lastLoginAtUtc: string | null
}

export type LoginResponse = {
  token: string
  expiresAtUtc: string
  admin: AdminAccount
}

export type SeoCheck = {
  key: string
  title: string
  status: 'pass' | 'warning' | 'fail'
  detail: string
  hint: string
}

export type SeoAudit = {
  score: number
  checkedAtUtc: string
  checks: SeoCheck[]
}

export type CheckoutInput = {
  planCode: string
  gymName: string
  slug: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  password: string
  billingCycle: number
}

export type CheckoutResponse = {
  orderId: string
  status: string
  portalUrl: string | null
  amountToman: number
  message: string | null
}

export const ORDER_STATUS = {
  0: 'در حال ساخت',
  1: 'در انتظار تسویه',
  2: 'پرداخت‌شده',
  3: 'ناموفق',
  4: 'لغوشده',
} as const

export const TENANT_STATUS = {
  0: 'فعال',
  1: 'غیرفعال',
  2: 'آزمایشی',
  3: 'آرشیوشده',
  4: 'تعلیق‌شده',
} as const

export const TENANT_PLAN = {
  0: 'پایه',
  1: 'حرفه‌ای',
  2: 'سازمانی',
} as const
