import { z } from 'zod'

export const gymRoleSchema = z.enum(['Owner', 'GroupAdmin', 'BranchManager', 'Trainer', 'Member'])
export const mediaKindSchema = z.enum(['Image', 'Gif', 'AnimatedSvg', 'Video'])
export const idSchema = z.string().min(1)
export const isoDateTimeSchema = z.string().datetime({ offset: true })

export const gymBranchSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  name: z.string().min(1).max(120),
  code: z.string().max(32).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(40).optional(),
  isHeadquarters: z.boolean(),
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
})

export const gymUserSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  branchIds: z.array(idSchema),
  displayName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  role: gymRoleSchema,
  isActive: z.boolean(),
  avatarUrl: z.string().url().optional(),
  createdAt: isoDateTimeSchema,
})

export const exerciseMediaSchema = z.object({
  kind: mediaKindSchema,
  url: z.string().url(),
  alt: z.string().optional(),
})

export const exerciseSchema = z.object({
  id: idSchema,
  tenantId: idSchema.optional(),
  name: z.string().min(1).max(180),
  localizedNames: z.record(z.string(), z.string()).optional(),
  description: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  category: z.enum(['Strength', 'Cardio', 'Mobility', 'Warmup', 'Other']),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  equipment: z.array(z.string()),
  isCustom: z.boolean(),
  media: exerciseMediaSchema.nullable().optional(),
  createdAt: isoDateTimeSchema.optional(),
  updatedAt: isoDateTimeSchema.optional(),
})

export const plannedSetSchema = z.object({
  id: idSchema,
  order: z.number().int().nonnegative(),
  kind: z.enum(['Working', 'Warmup', 'Drop', 'RestPause']),
  targetReps: z.number().int().positive().optional(),
  targetWeightKg: z.number().nonnegative().optional(),
  targetDurationSeconds: z.number().int().positive().optional(),
  targetDistanceMeters: z.number().nonnegative().optional(),
  targetRpe: z.number().min(1).max(10).optional(),
  targetRir: z.number().min(0).max(10).optional(),
})

export const plannedExerciseSchema = z.object({
  id: idSchema,
  exerciseId: idSchema,
  order: z.number().int().nonnegative(),
  restSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  supersetGroup: z.string().optional(),
  targetSets: z.array(plannedSetSchema),
})

export const routineSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  ownerUserId: idSchema,
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  isTemplate: z.boolean(),
  isArchived: z.boolean(),
  days: z.array(z.object({
    id: idSchema,
    name: z.string().min(1),
    weekday: z.number().int().min(0).max(6).optional(),
    exercises: z.array(plannedExerciseSchema),
  })),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const workoutSetLogSchema = z.object({
  id: idSchema,
  plannedSetId: idSchema.optional(),
  order: z.number().int().nonnegative(),
  kind: z.enum(['Working', 'Warmup', 'Drop', 'RestPause']),
  reps: z.number().int().nonnegative().optional(),
  weightKg: z.number().nonnegative().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  distanceMeters: z.number().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
  rir: z.number().min(0).max(10).optional(),
  completedAt: isoDateTimeSchema.optional(),
  isCompleted: z.boolean(),
})

export const bodyMeasurementSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  userId: idSchema,
  measuredAt: isoDateTimeSchema,
  weightKg: z.number().positive().optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  waistCm: z.number().positive().optional(),
  chestCm: z.number().positive().optional(),
  hipsCm: z.number().positive().optional(),
  neckCm: z.number().positive().optional(),
  leftArmCm: z.number().positive().optional(),
  rightArmCm: z.number().positive().optional(),
  leftThighCm: z.number().positive().optional(),
  rightThighCm: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const inviteGymMemberSchema = z.object({
  displayName: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional(),
  role: z.enum(['BranchManager', 'Trainer', 'Member']),
  branchIds: z.array(idSchema).min(1),
  trainerId: idSchema.optional(),
})
