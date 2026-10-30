import { readData, updateData } from '@/core/http-service'

import type { MemberPreferences } from '../_model/preferences'

const route = 'training/preferences'

export const getPreferences = () => readData<MemberPreferences>(route)

export const savePreferences = (preferences: MemberPreferences) =>
  updateData<MemberPreferences, MemberPreferences>(route, preferences)
