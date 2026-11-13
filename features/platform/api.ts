import { API_URL } from '@/configs/global'

import type {
  AdminAccount,
  CheckoutInput,
  CheckoutResponse,
  CmsPage,
  CmsPageSummary,
  LoginResponse,
  Order,
  Overview,
  PlatformPlan,
  SaveSearchConsoleInput,
  SearchConsole,
  SeoAudit,
  SitePayload,
  TenantAdmin,
} from './types'

/**
 * The platform API lives on the bare base domain, not on a tenant host. These helpers therefore
 * build the URL from NEXT_PUBLIC_API_URL directly and never send an X-Tenant header.
 */
const resolveApiBase = (): string | null => {
  const configured = API_URL?.trim()
  if (!configured) return null

  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(configured)

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(configured)
    ? configured
    : `${isLocal ? 'http' : 'https'}://${configured}`

  return withScheme.replace(/\/+$/, '')
}

const readJson = async <T>(response: Response): Promise<T> =>
  (await response.json()) as T

/** Server-render the marketing site from the CMS; `null` means "keep the built-in copy". */
export const fetchSite = async (): Promise<SitePayload | null> => {
  const base = resolveApiBase()
  if (!base) return null

  try {
    const response = await fetch(`${base}/api/platform/site`, {
      headers: { Accept: 'application/json' },
      // A slow API must not hold a production build or a cold render open.
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60, tags: ['platform-site'] },
    })

    return response.ok ? await readJson<SitePayload>(response) : null
  } catch {
    return null
  }
}

export const fetchPage = async (slug: string): Promise<CmsPage | null> => {
  const base = resolveApiBase()
  if (!base) return null

  try {
    const response = await fetch(`${base}/api/platform/pages/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60, tags: ['platform-site'] },
    })

    return response.ok ? await readJson<CmsPage>(response) : null
  } catch {
    return null
  }
}

export const fetchPublishedPages = async (): Promise<CmsPageSummary[]> => {
  const site = await fetchSite()
  return site?.pages ?? []
}

const problemMessage = async (response: Response): Promise<string> => {
  try {
    const problem = (await response.json()) as { detail?: string; title?: string }
    return problem.detail || problem.title || 'درخواست انجام نشد.'
  } catch {
    return 'درخواست انجام نشد.'
  }
}

export const checkout = async (input: CheckoutInput): Promise<CheckoutResponse> => {
  const base = resolveApiBase()
  if (!base) throw new Error('نشانی سرور پیکربندی نشده است.')

  const response = await fetch(`${base}/api/platform/orders`, {
    method: 'POST',
    cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) throw new Error(await problemMessage(response))

  return readJson<CheckoutResponse>(response)
}

/* ------------------------------------------------------------------ admin */

const TOKEN_KEY = 'hamowj.platform.token'
const ADMIN_KEY = 'hamowj.platform.admin'

export class PlatformAuthError extends Error {}

export const readAdminToken = (): string | null =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)

export const readAdminAccount = (): AdminAccount | null => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(ADMIN_KEY)
    return raw ? (JSON.parse(raw) as AdminAccount) : null
  } catch {
    return null
  }
}

export const clearAdminSession = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(ADMIN_KEY)
}

export const adminLogin = async (userName: string, password: string): Promise<LoginResponse> => {
  const base = resolveApiBase()
  if (!base) throw new Error('نشانی سرور پیکربندی نشده است.')

  const response = await fetch(`${base}/api/platform/admin/login`, {
    method: 'POST',
    cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password }),
  })

  if (!response.ok) throw new Error(await problemMessage(response))

  const session = await readJson<LoginResponse>(response)

  window.localStorage.setItem(TOKEN_KEY, session.token)
  window.localStorage.setItem(ADMIN_KEY, JSON.stringify(session.admin))

  return session
}

export const adminRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const base = resolveApiBase()
  const token = readAdminToken()

  if (!base) throw new Error('نشانی سرور پیکربندی نشده است.')
  if (!token) throw new PlatformAuthError('نشست مدیریت پیدا نشد.')

  const response = await fetch(`${base}/api/platform/admin${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 401) {
    clearAdminSession()
    throw new PlatformAuthError('نشست مدیریت منقضی شده است. دوباره وارد شوید.')
  }

  if (!response.ok) throw new Error(await problemMessage(response))

  return response.status === 204 ? (undefined as T) : readJson<T>(response)
}

export const platformAdmin = {
  logout: () => adminRequest<void>('/logout', { method: 'POST' }),

  overview: () => adminRequest<Overview>('/overview'),

  site: () => adminRequest<SitePayload>('/site'),

  saveSite: (body: unknown) =>
    adminRequest<SitePayload>('/site', { method: 'PUT', body: JSON.stringify(body) }),

  pages: () => adminRequest<CmsPage[]>('/pages'),

  createPage: (page: CmsPage) =>
    adminRequest<CmsPage>('/pages', { method: 'POST', body: JSON.stringify(page) }),

  updatePage: (id: string, page: CmsPage) =>
    adminRequest<CmsPage>(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(page) }),

  deletePage: (id: string) => adminRequest<void>(`/pages/${id}`, { method: 'DELETE' }),

  plans: () => adminRequest<PlatformPlan[]>('/plans'),

  createPlan: (plan: PlatformPlan) =>
    adminRequest<PlatformPlan>('/plans', { method: 'POST', body: JSON.stringify(plan) }),

  updatePlan: (id: string, plan: PlatformPlan) =>
    adminRequest<PlatformPlan>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(plan) }),

  deletePlan: (id: string) => adminRequest<void>(`/plans/${id}`, { method: 'DELETE' }),

  orders: (status?: number) =>
    adminRequest<Order[]>(`/orders${status === undefined ? '' : `?status=${status}`}`),

  markPaid: (id: string, paymentReference: string) =>
    adminRequest<Order>(`/orders/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ paymentReference }),
    }),

  cancelOrder: (id: string) =>
    adminRequest<Order>(`/orders/${id}/cancel`, { method: 'POST' }),

  tenants: () => adminRequest<TenantAdmin[]>('/tenants'),

  activateTenant: (id: string) =>
    adminRequest<TenantAdmin>(`/tenants/${encodeURIComponent(id)}/activate`, { method: 'POST' }),

  deactivateTenant: (id: string) =>
    adminRequest<TenantAdmin>(`/tenants/${encodeURIComponent(id)}/deactivate`, { method: 'POST' }),

  seoAudit: () => adminRequest<SeoAudit>('/seo/audit'),

  searchConsole: () => adminRequest<SearchConsole>('/search-console'),

  checkSearchConsole: () =>
    adminRequest<SearchConsole>('/search-console/check', { method: 'POST' }),

  saveSearchConsole: (body: SaveSearchConsoleInput) =>
    adminRequest<SearchConsole>('/search-console', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}
