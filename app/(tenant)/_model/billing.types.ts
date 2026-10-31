/**
 * Contracts of the /billing endpoints (Application/Billing + BillingController). Enums arrive as
 * numbers, so the values here must match the C# enums exactly.
 */

export enum ProductKind {
  CoachingPackage = 0,
  TrainingPlan = 1,
  Consultation = 2,
  GymMembership = 3,
  VipCoaching = 4,
  AddOn = 5,
}

export enum BillingPeriod {
  OneTime = 0,
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3,
}

/** Bit flags: a product's feature set is combined with | exactly like the backend enum. */
export enum ProductFeature {
  WorkoutTracking = 1,
  ExerciseLibrary = 2,
  ProgressTracking = 4,
  AdvancedStats = 8,
  ProgressPhotos = 16,
  PersonalizedPlans = 32,
  CoachFeedback = 64,
}

export enum SubscriptionStatus {
  Pending = 0,
  Active = 1,
  Expired = 2,
  Cancelled = 3,
}

export enum PaymentStatus {
  Pending = 0,
  Paid = 1,
  Failed = 2,
  Cancelled = 3,
  Refunded = 4,
}

export enum PaymentProvider {
  ZarinPal = 0,
  Manual = 1,
}

export enum TenantPlan {
  Starter = 0,
  Pro = 1,
  Enterprise = 2,
}

export enum TenantKind {
  Gym = 0,
  Coach = 1,
}

export interface BillingProduct {
  id: string
  name: string
  description: string | null
  kind: ProductKind
  price: number
  currency: string
  billingPeriod: BillingPeriod
  durationDays: number
  includedSessions: number | null
  capacity: number | null
  trialDays: number
  features: ProductFeature
  commissionPercent: number | null
  isPublished: boolean
  sortOrder: number
  activeSubscribers: number
  createdAt: string
}

export interface BillingProductInput {
  name: string
  description?: string | null
  kind: ProductKind
  price: number
  currency: string
  billingPeriod: BillingPeriod
  durationDays: number
  includedSessions?: number | null
  capacity?: number | null
  trialDays: number
  features: ProductFeature
  commissionPercent?: number | null
  isPublished: boolean
  sortOrder: number
}

export interface MemberSubscription {
  id: string
  memberUserId: string
  billingProductId: string
  productName: string
  kind: ProductKind
  status: SubscriptionStatus
  startsOn: string
  endsOn: string | null
  sessionsUsed: number
  includedSessions: number | null
  amountPaid: number
  currency: string
  features: ProductFeature
}

export interface Payment {
  id: string
  memberUserId: string | null
  billingProductId: string | null
  purpose: number
  amount: number
  currency: string
  status: PaymentStatus
  provider: PaymentProvider
  referenceId: string | null
  description: string | null
  failureReason: string | null
  createdAt: string
  paidAtUtc: string | null
}

export interface CheckoutResult {
  paymentId: string
  subscriptionId: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentUrl: string | null
  gatewayConfigured: boolean
  message: string | null
}

export interface UsageLimit {
  key: string
  label: string
  used: number | null
  limit: number | null
  isExceeded: boolean
}

export interface Entitlements {
  kind: TenantKind
  plan: TenantPlan
  status: number
  trialEndsAtUtc: string | null
  features: string[]
  limits: UsageLimit[]
}

export interface GatewaySettings {
  provider: PaymentProvider
  isEnabled: boolean
  isSandbox: boolean
  maskedMerchantId: string | null
  callbackUrl: string | null
  verifiedAtUtc: string | null
  lastError: string | null
}

export interface GatewaySettingsInput {
  provider: PaymentProvider
  merchantId?: string | null
  isSandbox: boolean
  isEnabled: boolean
  callbackUrl?: string | null
}

export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  [ProductKind.CoachingPackage]: 'پکیج مربیگری',
  [ProductKind.TrainingPlan]: 'برنامه تمرینی',
  [ProductKind.Consultation]: 'مشاوره',
  [ProductKind.GymMembership]: 'عضویت باشگاه',
  [ProductKind.VipCoaching]: 'مربیگری VIP',
  [ProductKind.AddOn]: 'افزونه',
}

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  [BillingPeriod.OneTime]: 'یک‌باره',
  [BillingPeriod.Monthly]: 'ماهانه',
  [BillingPeriod.Quarterly]: 'سه‌ماهه',
  [BillingPeriod.Yearly]: 'سالانه',
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.Pending]: 'در انتظار پرداخت',
  [SubscriptionStatus.Active]: 'فعال',
  [SubscriptionStatus.Expired]: 'منقضی',
  [SubscriptionStatus.Cancelled]: 'لغو شده',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'در انتظار',
  [PaymentStatus.Paid]: 'پرداخت شده',
  [PaymentStatus.Failed]: 'ناموفق',
  [PaymentStatus.Cancelled]: 'لغو شده',
  [PaymentStatus.Refunded]: 'برگشت خورده',
}

export const PLAN_LABELS: Record<TenantPlan, string> = {
  [TenantPlan.Starter]: 'استارتر',
  [TenantPlan.Pro]: 'حرفه‌ای',
  [TenantPlan.Enterprise]: 'سازمانی',
}

export const FEATURE_LABELS: Record<string, string> = {
  CoachAi: 'مربی هوشمند',
  MediaUploads: 'آپلود رسانه',
  PushNotifications: 'اعلان',
  Passkeys: 'ورود بدون رمز',
  GuestAccess: 'دسترسی مهمان',
  CustomCatalog: 'کتابخانه اختصاصی',
  Website: 'وب‌سایت باشگاه',
  Payments: 'پرداخت آنلاین',
  Lockers: 'کمد هوشمند',
}

/** Iranian Toman, the default tenant currency; the formatter only groups digits. */
export const formatPrice = (value: number, currency = 'IRT') =>
  `${(value ?? 0).toLocaleString('fa-IR')} ${currency === 'IRT' ? 'تومان' : currency}`
