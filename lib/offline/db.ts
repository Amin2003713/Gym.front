const DB_NAME = 'hamowj-offline'
const DB_VERSION = 1

export const HTTP_CACHE_STORE = 'http-cache'
export const MUTATION_QUEUE_STORE = 'mutation-queue'

let databasePromise: Promise<IDBDatabase> | null = null

const supported = () =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'

const openDatabase = (): Promise<IDBDatabase> => {
  if (!supported()) return Promise.reject(new Error('IndexedDB is not available.'))

  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(HTTP_CACHE_STORE)) {
          database.createObjectStore(HTTP_CACHE_STORE, { keyPath: 'key' })
        }
        if (!database.objectStoreNames.contains(MUTATION_QUEUE_STORE)) {
          const store = database.createObjectStore(MUTATION_QUEUE_STORE, {
            keyPath: 'id',
          })
          store.createIndex('createdAt', 'createdAt')
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(request.error ?? new Error('Could not open the offline database.'))
      request.onblocked = () =>
        reject(new Error('The offline database is blocked by another tab.'))
    }).catch((error) => {
      databasePromise = null
      throw error
    })
  }

  return databasePromise
}

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Offline storage request failed.'))
  })

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Offline storage transaction failed.'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Offline storage transaction aborted.'))
  })

/** Reads are best-effort: a blocked/private-mode database must never break a screen. */
export async function idbGet<T>(
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  if (!supported()) return undefined

  try {
    const database = await openDatabase()
    const transaction = database.transaction(storeName, 'readonly')
    return await requestResult<T | undefined>(
      transaction.objectStore(storeName).get(key) as IDBRequest<T | undefined>,
    )
  } catch {
    return undefined
  }
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  if (!supported()) return []

  try {
    const database = await openDatabase()
    const transaction = database.transaction(storeName, 'readonly')
    return await requestResult<T[]>(
      transaction.objectStore(storeName).getAll() as IDBRequest<T[]>,
    )
  } catch {
    return []
  }
}

export async function idbPut(storeName: string, value: unknown): Promise<boolean> {
  if (!supported()) return false

  try {
    const database = await openDatabase()
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(value)
    await transactionDone(transaction)
    return true
  } catch {
    return false
  }
}

export async function idbDelete(
  storeName: string,
  key: IDBValidKey,
): Promise<boolean> {
  if (!supported()) return false

  try {
    const database = await openDatabase()
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(key)
    await transactionDone(transaction)
    return true
  } catch {
    return false
  }
}

export async function idbCount(storeName: string): Promise<number> {
  if (!supported()) return 0

  try {
    const database = await openDatabase()
    const transaction = database.transaction(storeName, 'readonly')
    return await requestResult<number>(
      transaction.objectStore(storeName).count(),
    )
  } catch {
    return 0
  }
}

export async function idbClear(storeName: string): Promise<void> {
  if (!supported()) return

  try {
    const database = await openDatabase()
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).clear()
    await transactionDone(transaction)
  } catch {
    // Clearing is a cleanup path; a failure is not worth blocking sign-out.
  }
}
