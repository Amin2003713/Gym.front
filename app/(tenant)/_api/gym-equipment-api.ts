import { readData, updateData } from '@/core/http-service'

/** Gym-wide equipment: one barbell weight and one plate set for every member. */
export interface GymEquipment {
  barbellWeightKg: number
  plateSetKg: number[]
}

const BASE = 'GymEquipment'

export const getGymEquipment = () => readData<GymEquipment>(BASE)

/** Administrator-only; the API rejects members and coaches regardless of the UI. */
export const saveGymEquipment = (payload: GymEquipment) =>
  updateData<GymEquipment, GymEquipment>(BASE, payload)
