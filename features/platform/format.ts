/** Persian digits and Toman amounts, per the HamOwj UI rules. */
const numberFormat = new Intl.NumberFormat('fa-IR')

export const formatNumber = (value: number): string => numberFormat.format(value)

export const formatToman = (value: number): string =>
  value > 0 ? `${numberFormat.format(value)} تومان` : 'تماس بگیرید'

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(date)
}

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
