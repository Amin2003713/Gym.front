import { readData, updateData } from '@/core/http-service'

import type { OnboardingState } from '../_model/onboarding'

const route = 'onboarding'

export const getOnboarding = () => readData<OnboardingState>(route)

export const updateOnboarding = (patch: {
  tourCompleted?: boolean
  checklistDismissed?: boolean
}) => updateData<typeof patch, OnboardingState>(route, patch)
