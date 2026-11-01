import { readBlob, readData } from '@/core/http-service'

export interface MemberMeasurementPoint {
  date: string
  weightKg: number | null
  bodyFatPercent: number | null
  waistCm: number | null
}

export interface MemberActivityPoint {
  month: string
  sessions: number
  volumeKg: number
}

export interface MemberMuscleExercise {
  exerciseName: string
  role: 'primary' | 'secondary'
  estimatedOneRmKg: number | null
  lastTrainedOn: string | null
  lastWorkingWeightKg: number | null
  lastWorkingWeightPercentOfOneRm: number | null
}

export interface MemberMuscleProgress {
  muscleCode: string
  sets: number
  hardSets: number
  /** Null means the muscle has no logged set ("not trained"). */
  daysSinceTrained: number | null
  bestEstimatedOneRmKg: number | null
  exercises: MemberMuscleExercise[]
}

export interface MemberProgress {
  memberId: string
  memberName: string
  summary: {
    totalSessions: number
    sessionsThisMonth: number
    sessionsThisWeek: number
    totalReps: number
    totalRecords: number
    measurements: MemberMeasurementPoint[]
  }
  activity: MemberActivityPoint[]
  muscles: MemberMuscleProgress[]
}

const BASE = 'training/progress'

export const getMemberProgress = (memberId?: string | null) =>
  readData<MemberProgress>(`${BASE}${memberId ? `?memberId=${encodeURIComponent(memberId)}` : ''}`)

/** The same report as a server-rendered PDF (shared QuestPDF components). */
export const downloadMemberProgressReport = async (memberId: string, name: string) => {
  const blob = await readBlob(`${BASE}/report?memberId=${encodeURIComponent(memberId)}`)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `progress-${name || memberId}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
