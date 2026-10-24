/**
 * Tenant branding contract for the UI layer only.
 * Populate this from a real, authorized backend response when that API exists.
 * Do not infer tenant identity from a user-editable query string or trust arbitrary CSS values.
 */
export type TenantBranding = {
  tenantId: string
  displayName?: string
  logoUrl?: string
  theme?: 'default' | 'ocean' | 'forest' | 'sunset'
}

export const DEFAULT_TENANT_BRANDING: Pick<TenantBranding, 'theme'> = {
  theme: 'default',
}

/** Return a constrained data attribute; never forward arbitrary values into CSS. */
export function getTenantBrandAttribute(branding?: TenantBranding | null) {
  const allowed = new Set<TenantBranding['theme']>(['default', 'ocean', 'forest', 'sunset'])
  const theme = branding?.theme && allowed.has(branding.theme) ? branding.theme : 'default'
  return theme === 'default' ? undefined : theme
}
