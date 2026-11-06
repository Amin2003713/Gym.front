'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  QUEUE_CHANGED_EVENT,
  SYNC_EVENT,
  queuedMutationCount,
} from './mutation-queue'
import { flushOfflineQueue } from './sync'

export function useOfflineStatus() {
  const [online, setOnline] = useState(true)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(async () => {
    const count = await queuedMutationCount()
    setPending(count)
  }, [])

  useEffect(() => {
    // Deferred initial read: avoids a synchronous cascading render during hydration.
    const timer = window.setTimeout(() => {
      setOnline(navigator.onLine)
      void queuedMutationCount().then(setPending)
    }, 0)

    const onOnline = () => {
      setOnline(true)
      void flushOfflineQueue()
    }
    const onOffline = () => setOnline(false)
    const onQueueChanged = () => void refresh()
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<{ state: string }>).detail
      setSyncing(detail?.state === 'started')
      if (detail?.state === 'finished') void refresh()
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener(QUEUE_CHANGED_EVENT, onQueueChanged)
    window.addEventListener(SYNC_EVENT, onSync)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener(QUEUE_CHANGED_EVENT, onQueueChanged)
      window.removeEventListener(SYNC_EVENT, onSync)
    }
  }, [refresh])

  const syncNow = useCallback(async () => {
    setSyncing(true)
    try {
      await flushOfflineQueue()
    } finally {
      setSyncing(false)
      await refresh()
    }
  }, [refresh])

  return { online, pending, syncing, syncNow, refresh }
}
