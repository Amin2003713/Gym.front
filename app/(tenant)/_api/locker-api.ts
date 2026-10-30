import { createData, deleteData, readData, updateData } from '@/core/http-service'

import type {
  LockerAnalytics,
  LockerAssignment,
  LockerMap,
  LockerRoom,
  LockerRoomInput,
  LockerStatus,
  LockerUnlockResult,
  LockerZone,
  LockerZoneInput,
} from '../_model/locker.types'

const BASE = 'lockers'

export const getLockerMap = () => readData<LockerMap>(`${BASE}/map`)

export const getMyLocker = () =>
  readData<LockerAssignment | null>(`${BASE}/mine`)

export const checkIn = (expectedWorkoutMinutes?: number) =>
  createData<Record<string, never>, LockerAssignment>(
    `${BASE}/check-in${expectedWorkoutMinutes ? `?expectedWorkoutMinutes=${expectedWorkoutMinutes}` : ''}`,
    {},
  )

export const releaseLocker = (id: string) =>
  createData<Record<string, never>, void>(
    `${BASE}/${encodeURIComponent(id)}/release`,
    {},
  )

export const unlockLocker = (id: string, manualOverride = false) =>
  createData<Record<string, never>, LockerUnlockResult>(
    `${BASE}/${encodeURIComponent(id)}/unlock${manualOverride ? '?manualOverride=true' : ''}`,
    {},
  )

export const reportLockerIssue = (id: string, note?: string) =>
  createData<{ note?: string }, void>(
    `${BASE}/${encodeURIComponent(id)}/issue`,
    { note },
  )

export const createLockerRoom = (payload: LockerRoomInput) =>
  createData<LockerRoomInput, LockerRoom>(`${BASE}/rooms`, payload)

export const updateLockerRoom = (id: string, payload: LockerRoomInput) =>
  updateData<LockerRoomInput, LockerRoom>(
    `${BASE}/rooms/${encodeURIComponent(id)}`,
    payload,
  )

export const deleteLockerRoom = (id: string) =>
  deleteData(`${BASE}/rooms/${encodeURIComponent(id)}`)

export const createLockerZone = (payload: LockerZoneInput) =>
  createData<LockerZoneInput, LockerZone>(`${BASE}/zones`, payload)

export const deleteLockerZone = (id: string) =>
  deleteData(`${BASE}/zones/${encodeURIComponent(id)}`)

export const setLockerStatus = (id: string, status: LockerStatus, note?: string) =>
  updateData<{ status: LockerStatus; note?: string }, unknown>(
    `${BASE}/${encodeURIComponent(id)}/status`,
    { status, note },
  )

export const getLockerAnalytics = (days = 14) =>
  readData<LockerAnalytics>(`${BASE}/analytics?days=${days}`)
