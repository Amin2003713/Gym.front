import { useEffect, useState } from 'react'

function getStorageValue<T>(key: string): T | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key)
    if (!saved) return null
    return JSON.parse(saved) as T
  }

  return null
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState(() => {
    const stored = getStorageValue<T>(key)
    return stored ?? defaultValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value as T, setValue]
}
