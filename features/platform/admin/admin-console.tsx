'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Users,
  Wallet,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  clearAdminSession,
  PlatformAuthError,
  platformAdmin,
  readAdminAccount,
  readAdminToken,
} from '@/features/platform/api'
import { formatDate, formatNumber, formatToman } from '@/features/platform/format'
import type { AdminAccount, Order, Overview, TenantAdmin } from '@/features/platform/types'
import { ORDER_STATUS, TENANT_PLAN, TENANT_STATUS } from '@/features/platform/types'
import { cn } from '@/lib/utils'

import { AdminContent } from './admin-content'
import { AdminSeo } from './admin-seo'
import { EmptyState, Notice, Panel, ToneBadge } from './admin-ui'

type Tab = 'overview' | 'orders' | 'tenants' | 'plans' | 'pages' | 'site' | 'seo'

const tabs: { id: Tab; label: string; hint: string }[] = [
  { id: 'overview', label: 'نمای کلی', hint: 'شاخص‌های پلتفرم' },
  { id: 'orders', label: 'سفارش‌ها', hint: 'خرید و صورتحساب' },
  { id: 'tenants', label: 'پورتال‌ها', hint: 'وضعیت باشگاه‌ها' },
  { id: 'plans', label: 'پلن‌ها', hint: 'قیمت و مزایا' },
  { id: 'pages', label: 'صفحه‌ها', hint: 'محتوای سایت' },
  { id: 'site', label: 'محتوای سایت', hint: 'متن و برند' },
  { id: 'seo', label: 'سئو', hint: 'بررسی و بهبود' },
]

// The console session lives in localStorage, which is an external store: subscribe is a no-op
// because only this tab writes it, and reads hydrate from the browser without a mount flag.
const subscribeToSession = () => () => {}

const statusTone = (status: number): 'neutral' | 'success' | 'warning' | 'danger' =>
  status === 2 ? 'success' : status === 1 ? 'warning' : status === 3 ? 'danger' : 'neutral'

const tenantTone = (status: number): 'neutral' | 'success' | 'warning' | 'danger' =>
  status === 0 ? 'success' : status === 2 ? 'warning' : status === 4 ? 'danger' : 'neutral'

export function AdminConsole() {
  const router = useRouter()

  const token = useSyncExternalStore(subscribeToSession, readAdminToken, () => null)
  const account = useMemo<AdminAccount | null>(
    () => (token ? readAdminAccount() : null),
    [token],
  )
  const [tab, setTab] = useState<Tab>('overview')

  const [overview, setOverview] = useState<Overview | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [tenants, setTenants] = useState<TenantAdmin[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleAuthError = useCallback(() => {
    clearAdminSession()
    router.replace('/admin/signin')
  }, [router])

  const loadCore = useCallback(async () => {
    setBusy(true)
    setError(null)

    try {
      const [summary, orderRows, tenantRows] = await Promise.all([
        platformAdmin.overview(),
        platformAdmin.orders(),
        platformAdmin.tenants(),
      ])

      setOverview(summary)
      setOrders(orderRows)
      setTenants(tenantRows)
    } catch (cause) {
      if (cause instanceof PlatformAuthError) {
        handleAuthError()
        return
      }

      setError(cause instanceof Error ? cause.message : 'دریافت اطلاعات انجام نشد.')
    } finally {
      setBusy(false)
    }
  }, [handleAuthError])

  useEffect(() => {
    if (!token) router.replace('/admin/signin')
  }, [router, token])

  useEffect(() => {
    if (!token) return

    let cancelled = false

    Promise.all([platformAdmin.overview(), platformAdmin.orders(), platformAdmin.tenants()])
      .then(([summary, orderRows, tenantRows]) => {
        if (cancelled) return
        setOverview(summary)
        setOrders(orderRows)
        setTenants(tenantRows)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        if (cause instanceof PlatformAuthError) {
          handleAuthError()
          return
        }

        setError(cause instanceof Error ? cause.message : 'دریافت اطلاعات انجام نشد.')
      })

    return () => {
      cancelled = true
    }
  }, [token, handleAuthError])

  const logout = async () => {
    try {
      await platformAdmin.logout()
    } catch {
      // The local session is cleared either way: a dead token must not trap the operator.
    }

    clearAdminSession()
    router.replace('/admin/signin')
  }

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    setError(null)
    setNotice(null)
    setBusy(true)

    try {
      await action()
      setNotice(message)
      await loadCore()
    } catch (cause) {
      if (cause instanceof PlatformAuthError) {
        handleAuthError()
        return
      }

      setError(cause instanceof Error ? cause.message : 'عملیات انجام نشد.')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
        <div className="bg-muted mt-6 h-64 animate-pulse rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6">
      <header className="border-border mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <span className="bg-foreground text-background flex size-10 items-center justify-center rounded-lg">
            <HamOwjBrand className="size-6" />
          </span>
          <div>
            <p className="text-sm font-extrabold">پنل پلتفرم هم‌اوج</p>
            <p className="text-muted-foreground text-[11px]">
              {account?.displayName ?? 'مدیر پلتفرم'} · {account?.email ?? ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground border-border inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors"
          >
            سایت
            <ArrowLeft className="size-3.5" aria-hidden="true" />
          </Link>

          <Button variant="outline" size="sm" onClick={() => void loadCore()} isLoading={busy}>
            <RefreshCw className="size-3.5" aria-hidden="true" />
            به‌روزرسانی
          </Button>

          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut className="size-4" aria-hidden="true" />
            خروج
          </Button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav aria-label="بخش‌های پنل" className="lg:sticky lg:top-4 lg:self-start">
          <div className="no-scrollbar flex gap-1 overflow-x-auto lg:grid lg:overflow-visible">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-md px-3 py-2.5 text-right transition-colors',
                  tab === item.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="block text-xs font-bold">{item.label}</span>
                <span className={cn('mt-0.5 block text-[10px]', tab === item.id ? 'text-background/70' : '')}>
                  {item.hint}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="grid min-w-0 gap-4">
          {notice && <Notice tone="success">{notice}</Notice>}
          {error && <Notice tone="danger">{error}</Notice>}

          {tab === 'overview' && (
            <OverviewTab overview={overview} onOpenOrders={() => setTab('orders')} />
          )}

          {tab === 'orders' && (
            <OrdersTab
              orders={orders}
              busy={busy}
              onMarkPaid={(id, reference) =>
                runAction(() => platformAdmin.markPaid(id, reference), 'پرداخت سفارش ثبت شد.')
              }
              onCancel={(id) =>
                runAction(() => platformAdmin.cancelOrder(id), 'سفارش لغو شد.')
              }
            />
          )}

          {tab === 'tenants' && (
            <TenantsTab
              tenants={tenants}
              busy={busy}
              onToggle={(tenant) =>
                runAction(
                  () =>
                    tenant.status === 0
                      ? platformAdmin.deactivateTenant(tenant.id)
                      : platformAdmin.activateTenant(tenant.id),
                  tenant.status === 0 ? 'پورتال غیرفعال شد.' : 'پورتال فعال شد.',
                )
              }
            />
          )}

          {(tab === 'plans' || tab === 'pages' || tab === 'site') && (
            <AdminContent section={tab} onAuthError={handleAuthError} />
          )}

          {tab === 'seo' && <AdminSeo onAuthError={handleAuthError} />}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ overview */

function OverviewTab({
  overview,
  onOpenOrders,
}: {
  overview: Overview | null
  onOpenOrders: () => void
}) {
  if (!overview) {
    return <div className="bg-muted h-64 animate-pulse rounded-xl" />
  }

  const stats = [
    { label: 'پورتال‌های فعال', value: formatNumber(overview.activeTenants), icon: CheckCircle2 },
    { label: 'در دوره آزمایشی', value: formatNumber(overview.trialTenants), icon: Users },
    { label: 'در انتظار تسویه', value: formatNumber(overview.awaitingPaymentOrders), icon: CreditCard },
    { label: 'درآمد تسویه‌شده', value: formatToman(overview.paidRevenueToman), icon: Wallet },
  ]

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border-border bg-card rounded-xl border p-4">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-semibold">
              {stat.label}
              <stat.icon className="size-4" aria-hidden="true" />
            </div>
            <p className="mt-3 text-xl font-extrabold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <Panel
        title="آخرین سفارش‌ها"
        description={`${formatNumber(overview.orders)} سفارش ثبت شده است.`}
        actions={
          <Button variant="outline" size="sm" onClick={onOpenOrders}>
            همه سفارش‌ها
          </Button>
        }
      >
        {overview.recentOrders.length === 0 ? (
          <EmptyState
            title="هنوز سفارشی ثبت نشده"
            body="اولین خرید از صفحه قیمت‌ها انجام می‌شود و پورتال به‌صورت خودکار ساخته می‌شود."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>باشگاه</TableHead>
                <TableHead>پلن</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <p className="text-xs font-bold">{order.gymName}</p>
                    <p className="text-muted-foreground text-[10px]" dir="ltr">
                      {order.requestedSlug}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">{order.planName}</TableCell>
                  <TableCell className="text-xs">{formatToman(order.amountToman)}</TableCell>
                  <TableCell>
                    <ToneBadge tone={statusTone(order.status)}>
                      {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] ?? '—'}
                    </ToneBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(order.createdAtUtc)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}

/* -------------------------------------------------------------------- orders */

function OrdersTab({
  orders,
  busy,
  onMarkPaid,
  onCancel,
}: {
  orders: Order[]
  busy: boolean
  onMarkPaid: (id: string, reference: string) => Promise<void>
  onCancel: (id: string) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'awaiting' | 'paid'>('all')
  const [references, setReferences] = useState<Record<string, string>>({})

  const visible = orders.filter((order) => {
    if (filter === 'awaiting' && order.status !== 1) return false
    if (filter === 'paid' && order.status !== 2) return false

    const needle = query.trim().toLowerCase()
    if (!needle) return true

    return (
      order.gymName.toLowerCase().includes(needle) ||
      order.requestedSlug.toLowerCase().includes(needle) ||
      order.phoneNumber.includes(needle)
    )
  })

  return (
    <Panel
      title="سفارش‌ها و صورتحساب"
      description="پورتال هر سفارش به‌صورت خودکار ساخته شده است. پس از دریافت مبلغ، تسویه را ثبت کنید."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو بر اساس نام، نشانی یا تلفن"
          className="h-9 max-w-xs text-xs"
        />

        <div className="border-border flex rounded-md border p-0.5">
          {[
            { id: 'all', label: 'همه' },
            { id: 'awaiting', label: 'در انتظار تسویه' },
            { id: 'paid', label: 'پرداخت‌شده' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id as typeof filter)}
              className={cn(
                'rounded px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                filter === option.id ? 'bg-foreground text-background' : 'text-muted-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="سفارشی پیدا نشد" body="فیلتر را تغییر دهید یا منتظر اولین خرید بمانید." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>باشگاه</TableHead>
              <TableHead>مدیر</TableHead>
              <TableHead>پلن</TableHead>
              <TableHead>مبلغ</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>اقدام</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="text-xs font-bold">{order.gymName}</p>
                  <p className="text-muted-foreground text-[10px]" dir="ltr">
                    {order.requestedSlug}
                  </p>
                  {order.portalUrl && (
                    <a
                      href={order.portalUrl}
                      className="text-primary mt-1 inline-block text-[10px] underline underline-offset-4"
                      target="_blank"
                      rel="noreferrer"
                    >
                      بازکردن پورتال
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-xs">
                    {order.ownerFirstName} {order.ownerLastName}
                  </p>
                  <p className="text-muted-foreground text-[10px]" dir="ltr">
                    {order.phoneNumber}
                  </p>
                </TableCell>
                <TableCell className="text-xs">
                  {order.planName}
                  <span className="text-muted-foreground block text-[10px]">
                    {order.billingCycle === 1 ? 'سالانه' : 'ماهانه'}
                  </span>
                </TableCell>
                <TableCell className="text-xs">{formatToman(order.amountToman)}</TableCell>
                <TableCell>
                  <ToneBadge tone={statusTone(order.status)}>
                    {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] ?? '—'}
                  </ToneBadge>
                  {order.failureReason && (
                    <p className="text-destructive mt-1 max-w-48 text-[10px] leading-4">
                      {order.failureReason}
                    </p>
                  )}
                  {order.paymentReference && (
                    <p className="text-muted-foreground mt-1 text-[10px]" dir="ltr">
                      {order.paymentReference}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {order.status === 1 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Input
                        value={references[order.id] ?? ''}
                        onChange={(event) =>
                          setReferences((current) => ({ ...current, [order.id]: event.target.value }))
                        }
                        placeholder="شماره پیگیری"
                        className="h-8 w-28 text-[11px]"
                        dir="ltr"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void onMarkPaid(order.id, references[order.id] ?? '')}
                      >
                        ثبت پرداخت
                      </Button>
                    </div>
                  )}

                  {order.status !== 2 && order.status !== 4 && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onCancel(order.id)}
                      className="text-muted-foreground hover:text-destructive mt-1 block text-[10px] underline underline-offset-4"
                    >
                      لغو سفارش
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}

/* ------------------------------------------------------------------- tenants */

function TenantsTab({
  tenants,
  busy,
  onToggle,
}: {
  tenants: TenantAdmin[]
  busy: boolean
  onToggle: (tenant: TenantAdmin) => Promise<void>
}) {
  return (
    <Panel
      title="پورتال‌ها"
      description="همه باشگاه‌های ثبت‌شده روی پلتفرم. غیرفعال‌کردن، دسترسی اعضا را می‌بندد."
    >
      {tenants.length === 0 ? (
        <EmptyState title="هنوز پورتالی ساخته نشده" body="پورتال‌ها با اولین خرید یا فرم ثبت‌نام ساخته می‌شوند." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>باشگاه</TableHead>
              <TableHead>نشانی</TableHead>
              <TableHead>پلن</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>شروع</TableHead>
              <TableHead>اقدام</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="text-xs font-bold">{tenant.name ?? '—'}</TableCell>
                <TableCell className="text-xs" dir="ltr">
                  {tenant.host ?? tenant.identifier}
                </TableCell>
                <TableCell className="text-xs">
                  {TENANT_PLAN[tenant.plan as keyof typeof TENANT_PLAN] ?? '—'}
                </TableCell>
                <TableCell>
                  <ToneBadge tone={tenantTone(tenant.status)}>
                    {TENANT_STATUS[tenant.status as keyof typeof TENANT_STATUS] ?? '—'}
                  </ToneBadge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(tenant.createdAtUtc)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void onToggle(tenant)}
                  >
                    {tenant.status === 0 ? 'غیرفعال‌کردن' : 'فعال‌کردن'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}

export const AdminShellIcon = LayoutDashboard
