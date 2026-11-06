import { queryClient } from '@/lib/react-query'

import {
  QUEUE_CHANGED_EVENT,
  SYNC_EVENT,
  listQueuedMutations,
  markQueuedMutationAttempt,
  removeQueuedMutation,
} from './mutation-queue'

export type SyncResult = {
  sent: number
  discarded: number
  pending: number
}

let flushPromise: Promise<SyncResult> | null = null

const emitSync = (detail: {
  state: 'started' | 'finished'
  sent?: number
  discarded?: number
  pending?: number
}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail }))
}

const permanentFailure = (error: unknown): boolean => {
  const status = (
    error as { response?: { status?: number } } | undefined
  )?.response?.status

  return typeof status === 'number' && status >= 400 && status < 500
}

/**
 * Replays the durable queue in creation order. A network failure stops the run (the rest
 * stays queued); a 4xx means that one request will never succeed and is dropped so a bad
 * entry cannot block every later set forever.
 */
export function flushOfflineQueue(): Promise<SyncResult> {
  if (flushPromise) return flushPromise

  flushPromise = (async () => {
    if (typeof window === 'undefined' || navigator.onLine === false) {
      return { sent: 0, discarded: 0, pending: await countPending() }
    }

    emitSync({ state: 'started' })

    let sent = 0
    let discarded = 0
    const items = await listQueuedMutations()

    for (const item of items) {
      try {
        // Imported lazily to keep the http-service ↔ queue graph acyclic at module load.
        const { flushQueuedMutation } = await import('@/core/http-service')
        await flushQueuedMutation(item)
        await removeQueuedMutation(item.id)
        sent += 1
      } catch (error) {
        if (permanentFailure(error)) {
          await removeQueuedMutation(item.id)
          discarded += 1
          continue
        }

        await markQueuedMutationAttempt(item)
        break
      }
    }

    const pending = await countPending()

    if (sent > 0) {
      // The server now has sets the visible screens have not seen yet.
      void queryClient.invalidateQueries()
    }

    const result = { sent, discarded, pending }
    emitSync({ state: 'finished', ...result })
    window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT))
    return result
  })().finally(() => {
    flushPromise = null
  })

  return flushPromise
}

async function countPending(): Promise<number> {
  const { queuedMutationCount } = await import('./mutation-queue')
  return queuedMutationCount()
}
