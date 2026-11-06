import { MUTATION_QUEUE_STORE, idbDelete, idbGetAll, idbPut } from './db'

export const QUEUE_CHANGED_EVENT = 'hamowj:queue-changed'
export const SYNC_EVENT = 'hamowj:sync'

export type QueuedMutation = {
  id: string
  url: string
  method: string
  data?: unknown
  headers?: Record<string, string>
  createdAt: number
  attempts: number
  label: string
}

const MAX_QUEUE_ITEMS = 250

const notifyQueueChanged = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT))
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/**
 * Only workout writes are queued. Payments, account changes and anything that could be
 * money- or access-related must always reach the server before the UI calls it saved.
 *
 * URLs arrive both relative (`workout/...`) and absolute (axios error configs), so the
 * normalizer strips the origin and `/api/` before matching.
 */
export function normalizeMutationPath(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/api\//, '')
    .replace(/^\/+/, '')
    .split('?')[0]
}

export function isQueueableMutation(url: string, method: string): boolean {
  const verb = method.toUpperCase()
  if (verb !== 'POST' && verb !== 'PUT' && verb !== 'PATCH' && verb !== 'DELETE')
    return false

  const path = normalizeMutationPath(url)
  if (!path.startsWith('workout/')) return false

  // Session creation and completion change server-side state that other screens and
  // reports depend on; only set/exercise writes are safe to replay.
  if (verb === 'POST') {
    return (
      /^workout\/[^/]+\/sets$/.test(path) ||
      /^workout\/[^/]+\/exercises$/.test(path)
    )
  }

  return (
    /^workout\/sets\/[^/]+$/.test(path) ||
    /^workout\/[^/]+\/exercises\/[^/]+$/.test(path)
  )
}

/** A caller-friendly answer so the trainer's screen can continue while offline. */
export function queuedMutationResult(url: string, method: string): unknown {
  const path = normalizeMutationPath(url)

  if (method.toUpperCase() === 'POST' && /\/(sets)$/.test(path)) {
    return { queued: true, results: [] }
  }
  if (method.toUpperCase() === 'POST' && /\/exercises$/.test(path)) {
    return { queued: true, exercise: null }
  }
  return { queued: true }
}

export async function enqueueMutation(input: {
  url: string
  method: string
  data?: unknown
  headers?: Record<string, string>
  label?: string
}): Promise<QueuedMutation> {
  const existing = await idbGetAll<QueuedMutation>(MUTATION_QUEUE_STORE)

  const item: QueuedMutation = {
    id: newId(),
    url: input.url,
    method: input.method.toUpperCase(),
    data: input.data,
    headers: input.headers,
    createdAt: Date.now(),
    attempts: 0,
    label:
      input.label ??
      (input.method.toUpperCase() === 'POST' ? 'ثبت ست تمرین' : 'ویرایش ست تمرین'),
  }

  await idbPut(MUTATION_QUEUE_STORE, item)

  if (existing.length >= MAX_QUEUE_ITEMS) {
    const oldest = existing
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, existing.length - MAX_QUEUE_ITEMS + 1)
    await Promise.all(oldest.map((row) => idbDelete(MUTATION_QUEUE_STORE, row.id)))
  }

  notifyQueueChanged()
  return item
}

export async function listQueuedMutations(): Promise<QueuedMutation[]> {
  const rows = await idbGetAll<QueuedMutation>(MUTATION_QUEUE_STORE)
  return rows.sort((a, b) => a.createdAt - b.createdAt)
}

export async function removeQueuedMutation(id: string): Promise<void> {
  await idbDelete(MUTATION_QUEUE_STORE, id)
  notifyQueueChanged()
}

export async function markQueuedMutationAttempt(
  item: QueuedMutation,
): Promise<void> {
  await idbPut(MUTATION_QUEUE_STORE, {
    ...item,
    attempts: item.attempts + 1,
  })
}

export async function queuedMutationCount(): Promise<number> {
  const rows = await idbGetAll<QueuedMutation>(MUTATION_QUEUE_STORE)
  return rows.length
}

export async function clearMutationQueue(): Promise<void> {
  const rows = await idbGetAll<QueuedMutation>(MUTATION_QUEUE_STORE)
  await Promise.all(rows.map((row) => idbDelete(MUTATION_QUEUE_STORE, row.id)))
  notifyQueueChanged()
}
