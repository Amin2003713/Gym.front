'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import { GenderEnum } from '@/enums/gender.enum'
import { usersApi } from '@/features/users/api/users-api'

export type FigureGender = 'male' | 'female'

type ProfileLike = Awaited<ReturnType<typeof usersApi.info>>

// Every body map asks for the gender; one shared request per user keeps a page with
// several maps from firing the same profile call over and over.
const PROFILE_CACHE = new Map<string, Promise<ProfileLike>>()

function profileRequest(userId: string): Promise<ProfileLike> {
  const cached = PROFILE_CACHE.get(userId)
  if (cached) return cached
  const request = usersApi.info(userId)
  PROFILE_CACHE.set(userId, request)
  request.catch(() => PROFILE_CACHE.delete(userId))
  return request
}

/**
 * The API contract is numeric: backend GenderEnum Male = 0, Female = 1
 * (see enums/gender.enum.ts). Legacy string names are still accepted for
 * resilience.
 */
export function normalizeGender(value: unknown): FigureGender | null {
  if (value === GenderEnum.Male || value === 0 || value === '0') return 'male'
  if (value === GenderEnum.Female || value === 1 || value === '1') return 'female'
  const normalized = String(value ?? '').trim().toLowerCase()
  if (['male', 'man', 'm', 'مرد', 'آقا'].includes(normalized)) return 'male'
  if (['female', 'woman', 'f', 'زن', 'خانم'].includes(normalized)) return 'female'
  return null
}

function genderFromToken(token: unknown): FigureGender | null {
  if (typeof token !== 'string') return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    const claims = JSON.parse(decoded) as Record<string, unknown>
    const profile =
      claims.profile && typeof claims.profile === 'object'
        ? (claims.profile as Record<string, unknown>)
        : {}
    for (const key of ['gender', 'Gender', 'sex', 'Sex']) {
      const gender = normalizeGender(claims[key] ?? profile[key])
      if (gender) return gender
    }
  } catch {
    /* Opaque/non-JWT tokens are expected; profile lookup remains available. */
  }
  return null
}

/**
 * Resolves the body-map figure gender: JWT claims → session user → profile API
 * (`user/User-Info`). Falls back to 'male' only when nothing is resolvable,
 * and exposes an override for i18n/membership flows.
 */
export function useFigureGender(userId?: string | null, override?: FigureGender | null): FigureGender {
  const { data: session } = useSession()
  const sessionUser = session?.user as
    | { gender?: number | string | null; accessToken?: string; id?: string }
    | undefined

  const [figureGender, setFigureGender] = useState<FigureGender>(
    () => genderFromToken(sessionUser?.accessToken) ?? normalizeGender(sessionUser?.gender) ?? 'male',
  )

  useEffect(() => {
    const tokenGender = genderFromToken(sessionUser?.accessToken)
    const sessionGender = normalizeGender(sessionUser?.gender)
    if (tokenGender ?? sessionGender) setFigureGender((tokenGender ?? sessionGender)!)

    const targetUserId = userId ?? sessionUser?.id

    if (targetUserId) {
      let alive = true
      profileRequest(targetUserId)
        .then((profile) => {
          if (!alive) return
          const profileGender = normalizeGender(profile?.gender)
          if (profileGender) setFigureGender(profileGender)
        })
        .catch(() => {
          /* Keep the gender resolved from session/JWT if profile lookup fails. */
        })
      return () => {
        alive = false
      }
    }
  }, [userId, sessionUser?.id, sessionUser?.gender, sessionUser?.accessToken])

  return override ?? figureGender
}
