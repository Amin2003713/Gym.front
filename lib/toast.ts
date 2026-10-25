'use client'

import { sileo } from 'sileo'

type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

type ToastOptions = {
  description?: string
  duration?: number | null
  position?: ToastPosition
}

function notify(
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  options?: ToastOptions,
) {
  const payload = {
    title: title || (type === 'error' ? 'خطا' : 'اطلاع'),
    ...(options?.description ? { description: options.description } : {}),
    ...(options?.duration !== undefined ? { duration: options.duration } : {}),
    ...(options?.position ? { position: options.position } : {}),
  }

  switch (type) {
    case 'success':
      return sileo.success(payload)
    case 'error':
      return sileo.error(payload)
    case 'warning':
      return sileo.warning(payload)
    case 'info':
      return sileo.info(payload)
  }
}

/**
 * Small compatibility facade for the existing Sonner call sites.
 * This keeps their current success/error messages while rendering everything
 * through Sileo, so feature code does not need to know the toast provider.
 */
export const toast = {
  success: (title: string, options?: ToastOptions) => notify('success', title, options),
  error: (title: string, options?: ToastOptions) => notify('error', title, options),
  warning: (title: string, options?: ToastOptions) => notify('warning', title, options),
  info: (title: string, options?: ToastOptions) => notify('info', title, options),
}
