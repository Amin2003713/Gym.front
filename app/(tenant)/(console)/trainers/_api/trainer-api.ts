import type { GymUser, TrainerAssignment } from '@/features/gym/domain/types'

// Mock API - in production this would call the .NET backend
// These are placeholder implementations that should be replaced with real API calls

export interface ListMembersQuery {
  role?: 'Trainer' | 'Member'
  search?: string
}

export async function listMembers(query: ListMembersQuery = {}): Promise<GymUser[]> {
  // TODO: Replace with real API call to /api/gym/members or similar
  // For now, return empty array - the UI should handle this gracefully
  console.log('listMembers called with:', query)
  return []
}

export interface AssignTrainerRequest {
  memberId: string
  trainerId: string
  startsAt?: string
}

export interface AssignTrainerResponse {
  assignmentId: string
  expiresAt: string
}

export async function assignTrainerToMember(
  assignment: AssignTrainerRequest
): Promise<AssignTrainerResponse> {
  // TODO: Replace with real API call
  // For now, simulate success
  console.log('assignTrainerToMember called with:', assignment)
  
  return {
    assignmentId: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  }
}