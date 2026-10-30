import { createData, deleteData, readData } from '@/core/http-service'

import type {
  BodyMeasurement,
  MeasurementSummary,
  MemberHome,
  UpsertMeasurementInput,
} from '../_model/training.types'

const BASE = 'training'

/** Streak, current-week activity and the latest weigh-in of the signed-in member. */
export const getTrainingHome = () => readData<MemberHome>(`${BASE}/home`)

export const listMyMeasurements = (page = 1, pageSize = 60) =>
  readData<BodyMeasurement[]>(
    `${BASE}/measurements?page=${page}&pageSize=${pageSize}`,
  )

/** Coach view: the same history for one member (members may read their own). */
export const listMemberMeasurements = (memberId: string, page = 1, pageSize = 60) =>
  readData<BodyMeasurement[]>(
    `${BASE}/measurements/member/${encodeURIComponent(memberId)}?page=${page}&pageSize=${pageSize}`,
  )

/** First vs latest of the plan-relevant metrics; without an id it summarises the caller. */
export const getMeasurementSummary = (memberId?: string | null) =>
  readData<MeasurementSummary>(
    `${BASE}/measurements/summary${memberId ? `?memberId=${encodeURIComponent(memberId)}` : ''}`,
  )

export const upsertMeasurement = (payload: UpsertMeasurementInput) =>
  createData<UpsertMeasurementInput, BodyMeasurement>(
    `${BASE}/measurements`,
    payload,
  )

export const deleteMeasurement = (id: string) =>
  deleteData(`${BASE}/measurements/${encodeURIComponent(id)}`)
