import { readData, updateData } from '@/core/http-service'

/** The gym's stored settings, as returned by GET tenant/get-info. */
export interface GymSettings {
  id: string
  identifier: string
  name: string | null
  legalName: string | null
  licenseNumber: string | null
  licenseExpiresOn: string | null
  isListedPublicly: boolean

  phoneNumber: string | null
  landLine: string | null
  email: string | null
  website: string | null

  address: string | null
  postalCode: string | null
  city: string | null
  province: string | null
  country: string | null

  primaryColor: string | null
  timeZoneId: string
  defaultCulture: string
  weightUnit: string

  host: string | null
  url: string | null
  status: number
  plan: number
  createdAtUtc: string
}

/** The editable part sent to PUT tenant/settings. Omitted fields keep their stored value. */
export interface UpdateGymSettingsInput {
  name: string
  legalName: string | null
  licenseNumber: string | null
  licenseExpiresOn: string | null
  isListedPublicly: boolean

  phoneNumber: string | null
  landLine: string | null
  email: string | null
  website: string | null

  address: string | null
  postalCode: string | null
  city: string | null
  province: string | null
  country: string | null

  primaryColor: string | null
  timeZoneId: string
  defaultCulture: string
  weightUnit: string
}

export const getGymSettings = () => readData<GymSettings>('tenant/get-info')

/** Administrator-only; the API rejects members and coaches regardless of the UI. */
export const saveGymSettings = (input: UpdateGymSettingsInput) =>
  updateData<UpdateGymSettingsInput, GymSettings>('tenant/settings', input)
