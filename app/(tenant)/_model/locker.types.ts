/** Contracts of the /lockers endpoints (Application/Lockers + LockersController). */

export enum LockerZoneAccess {
  General = 0,
  Men = 1,
  Women = 2,
  Vip = 3,
  Staff = 4,
}

export enum LockerSize {
  Small = 0,
  Medium = 1,
  Large = 2,
}

export enum LockerStatus {
  Available = 0,
  Occupied = 1,
  OutOfService = 2,
}

export interface Locker {
  id: string
  code: string
  row: number
  column: number
  size: LockerSize
  status: LockerStatus
  occupiedByUserId: string | null
  occupiedSinceUtc: string | null
  occupiedUntilUtc: string | null
  note: string | null
}

export interface LockerZone {
  id: string
  name: string
  access: LockerZoneAccess
  rows: number
  columns: number
  lockers: Locker[]
}

export interface LockerRoom {
  id: string
  name: string
  description: string | null
  floor: string | null
  hardwareProvider: string | null
  hardwareConfigured: boolean
  unlockWindowMinutes: number
  minutesBeforeWorkout: number
  minutesAfterWorkout: number
  zones: LockerZone[]
}

export interface LockerMap {
  rooms: LockerRoom[]
  lockers: number
  occupied: number
  outOfService: number
  hardwareConfigured: boolean
}

export interface LockerAssignment {
  lockerId: string
  roomId: string
  roomName: string
  zoneId: string
  zoneName: string
  code: string
  size: LockerSize
  row: number
  column: number
  assignedAtUtc: string
  untilUtc: string
  hardwareConfigured: boolean
  unlockWindowMinutes: number
  reusedExistingHold: boolean
}

export interface LockerUnlockResult {
  unlocked: boolean
  manualOverride: boolean
  message: string | null
  validUntilUtc: string | null
}

export interface LockerZoneUsage {
  zoneId: string
  roomName: string
  zoneName: string
  lockers: number
  occupied: number
  utilizationPercent: number
}

export interface LockerHourlyUsage {
  hour: number
  assignments: number
  averageHoldMinutes: number
}

export interface LockerAnalytics {
  roomCount: number
  zoneCount: number
  lockers: number
  occupied: number
  outOfService: number
  utilizationPercent: number
  peakHour: number
  averageOccupancyMinutes: number
  assignments: number
  unlockAttempts: number
  unlockFailures: number
  zones: LockerZoneUsage[]
  hours: LockerHourlyUsage[]
}

export interface LockerRoomInput {
  name: string
  description?: string | null
  floor?: string | null
  hardwareProvider?: string | null
  hardwareEndpoint?: string | null
  unlockWindowMinutes: number
  minutesBeforeWorkout: number
  minutesAfterWorkout: number
}

export interface LockerZoneInput {
  lockerRoomId: string
  name: string
  access: LockerZoneAccess
  rows: number
  columns: number
  generateLockers: boolean
  defaultSize: LockerSize
}

export const ZONE_ACCESS_LABELS: Record<LockerZoneAccess, string> = {
  [LockerZoneAccess.General]: 'عمومی',
  [LockerZoneAccess.Men]: 'آقایان',
  [LockerZoneAccess.Women]: 'بانوان',
  [LockerZoneAccess.Vip]: 'VIP',
  [LockerZoneAccess.Staff]: 'کارکنان',
}

export const LOCKER_SIZE_LABELS: Record<LockerSize, string> = {
  [LockerSize.Small]: 'کوچک',
  [LockerSize.Medium]: 'متوسط',
  [LockerSize.Large]: 'بزرگ',
}

/** How far a hold is through its life, for the "time left" bar in the member view. */
export const remainingMinutes = (untilUtc: string) =>
  Math.max(0, Math.round((new Date(untilUtc).getTime() - Date.now()) / 60000))
