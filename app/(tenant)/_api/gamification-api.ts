import { readData } from '@/core/http-service'

import type { GamificationData } from '../_model/gamification'

/** XP, level, streaks and badges for the signed-in member. */
export const getGamification = () => readData<GamificationData>('training/gamification')
