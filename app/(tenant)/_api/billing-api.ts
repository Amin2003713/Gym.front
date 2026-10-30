import { createData, deleteData, readData, updateData } from '@/core/http-service'

import type {
  BillingProduct,
  BillingProductInput,
  CheckoutResult,
  Entitlements,
  GatewaySettings,
  GatewaySettingsInput,
  MemberSubscription,
  Payment,
  TenantPlan,
} from '../_model/billing.types'

const BASE = 'billing'

export const listProducts = () => readData<BillingProduct[]>(`${BASE}/products`)

export const createProduct = (payload: BillingProductInput) =>
  createData<BillingProductInput, BillingProduct>(`${BASE}/products`, payload)

export const updateProduct = (id: string, payload: BillingProductInput) =>
  updateData<BillingProductInput, BillingProduct>(
    `${BASE}/products/${encodeURIComponent(id)}`,
    payload,
  )

export const archiveProduct = (id: string) =>
  deleteData(`${BASE}/products/${encodeURIComponent(id)}`)

export const listMySubscriptions = () =>
  readData<MemberSubscription[]>(`${BASE}/subscriptions/mine`)

export const listSubscriptions = (page = 1, pageSize = 50) =>
  readData<MemberSubscription[]>(
    `${BASE}/subscriptions?page=${page}&pageSize=${pageSize}`,
  )

export const listPayments = (page = 1, pageSize = 50) =>
  readData<Payment[]>(`${BASE}/payments?page=${page}&pageSize=${pageSize}`)

export const checkout = (productId: string) =>
  createData<{ productId: string }, CheckoutResult>(`${BASE}/checkout`, { productId })

export const verifyPayment = (paymentId: string) =>
  createData<Record<string, never>, Payment>(
    `${BASE}/payments/${encodeURIComponent(paymentId)}/verify`,
    {},
  )

/** The gateway's browser return: the server finds the row by authority and verifies it. */
export const verifyPaymentByAuthority = (authority: string) =>
  createData<{ authority: string; status?: string }, Payment>(
    `${BASE}/payments/callback`,
    { authority },
  )

export const cancelPayment = (paymentId: string) =>
  createData<Record<string, never>, Payment>(
    `${BASE}/payments/${encodeURIComponent(paymentId)}/cancel`,
    {},
  )

export const getEntitlements = () => readData<Entitlements>(`${BASE}/entitlements`)

export const applyPlan = (plan: TenantPlan) =>
  updateData<{ plan: TenantPlan }, Entitlements>(`${BASE}/plan`, { plan })

export const getGatewaySettings = () => readData<GatewaySettings>(`${BASE}/gateway`)

export const saveGatewaySettings = (payload: GatewaySettingsInput) =>
  updateData<GatewaySettingsInput, GatewaySettings>(`${BASE}/gateway`, payload)
