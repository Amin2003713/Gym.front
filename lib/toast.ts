'use client'

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export type ToastOptions = {
  description?: string
  /** Milliseconds before auto-dismiss; null keeps the toast until it is closed. */
  duration?: number | null
  position?: ToastPosition
}

export type ToastItem = {
  id: number
  kind: ToastKind
  title: string
  description?: string
  duration: number | null
  position: ToastPosition
}

const MAX_VISIBLE = 4
const DEFAULT_DURATION = 4500
const ERROR_DURATION = 6500

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<(value: ToastItem[]) => void>()
const EMPTY: ToastItem[] = []

const commit = (next: ToastItem[]) => {
  items = next
  listeners.forEach((listener) => listener(items))
}

export const subscribeToasts = (listener: (value: ToastItem[]) => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getToasts = () => items

/** Server render never has toasts; the snapshot must be stable between renders. */
export const getServerToasts = () => EMPTY

export const dismissToast = (id: number) => {
  if (!items.some((item) => item.id === id)) return
  commit(items.filter((item) => item.id !== id))
}

export const dismissAllToasts = () => {
  if (items.length) commit([])
}

function notify(kind: ToastKind, title: string, options?: ToastOptions) {
  const duration =
    options?.duration === undefined
      ? kind === 'error'
        ? ERROR_DURATION
        : DEFAULT_DURATION
      : options.duration

  const item: ToastItem = {
    id: nextId++,
    kind,
    // An empty title is a caller bug, not a reason to render an empty card.
    title: title.trim() || (kind === 'error' ? 'خطا' : 'اطلاع'),
    ...(options?.description?.trim() ? { description: options.description.trim() } : {}),
    duration,
    position: options?.position ?? 'top-center',
  }

  // Oldest first, newest at the bottom of the stack; beyond four, the oldest is dropped.
  commit([...items, item].slice(-MAX_VISIBLE))
  return item.id
}

/**
 * One facade for every screen. Feature code calls `toast.success('…')` and does not know how
 * notifications are rendered, so the presentation can change without touching 200 call sites.
 */
export const toast = {
  success: (title: string, options?: ToastOptions) => notify('success', title, options),
  error: (title: string, options?: ToastOptions) => notify('error', title, options),
  warning: (title: string, options?: ToastOptions) => notify('warning', title, options),
  info: (title: string, options?: ToastOptions) => notify('info', title, options),
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
}
