import { clearHttpCache } from './http-cache'
import { clearMutationQueue } from './mutation-queue'

/**
 * Cached screens and queued sets belong to the signed-in user. Clearing both on sign-out
 * prevents the next person on a shared device from seeing or replaying them.
 */
export async function clearOfflineData(): Promise<void> {
  await Promise.all([clearHttpCache(), clearMutationQueue()])

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      registration?.active?.postMessage('CLEAR_CACHES')
    } catch {
      // The app still signs out even when a worker is unavailable.
    }
  }
}
