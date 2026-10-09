import type { ReportReason, ReportResolution } from '@/lib/moderation/types'
import type { PetState, TakedownReason } from '@/lib/pets/types'
import type { RejectionReason } from '@/lib/verification/identity'
import type { VerificationLevel } from '@/lib/verification/level'
import type { DepartmentCode } from '@/lib/zones/departments'

/** Las tres colas, en su orden fijo (FR-012). */
export const QUEUE_KEYS = ['identity', 'pets', 'reports'] as const
export type QueueKey = (typeof QUEUE_KEYS)[number]

/** Lo propio de quien mira en una cola: desde cuándo y, si es una publicación, el animal. */
export type OwnPending = { since: Date; petName: string | null }

/** Una cola para quien mira: lo que puede resolver, desde cuándo espera el más viejo, y lo suyo. */
export type QueueCount = { others: number; oldest: Date | null; own: OwnPending[] }

export type QueueStanding =
  | { kind: 'clear' }
  | { kind: 'on_time'; waitedMs: number }
  | { kind: 'overdue'; waitedMs: number; overMs: number }

export type RecordSuspension = {
  reason: string
  suspendedAt: Date
  /** Null: una cuenta borrada (FR-034). */
  suspendedBy: string | null
  liftedAt: Date | null
  liftedBy: string | null
}

export type RecordIdentity = {
  verifiedOn: string | null
  open: { id: string; sentAt: Date; isOwn: boolean } | null
  rejections: { rejectedOn: string; reason: RejectionReason }[]
  expiredOn: string | null
}

export type RecordReport = {
  reason: ReportReason
  details: string | null
  createdAt: Date
  resolvedAt: Date | null
  resolution: ReportResolution | null
}

export type RecordPet = {
  code: string
  name: string
  state: PetState
  pendingReview: boolean
  takedownReason: TakedownReason | null
  publishedAt: Date
}

export type PersonRecord = {
  person: {
    publicId: string
    name: string
    avatarPath: string | null
    department: DepartmentCode | null
    locality: string
    memberSince: Date
    level: VerificationLevel
    isSelf: boolean
    suspension: { id: string; reason: string; suspendedAt: Date; suspendedBy: string | null } | null
  }
  identity: RecordIdentity
  /** En la propia ficha, `items` vacío y `ownOpen` con los sin resolver sobre quien mira. */
  reports: { ownOpen: number; items: RecordReport[] }
  suspensions: RecordSuspension[]
  pets: RecordPet[]
}

export type PersonResult = {
  publicId: string
  name: string
  avatarUrl: string | null
  department: DepartmentCode | null
  locality: string
  isSuspended: boolean
}

/** Lo que reclama el resumen de una persona: cuántos y el más viejo de cada cola, sin lo suyo. */
export type DigestClaim = { userId: string } & Record<
  QueueKey,
  { count: number; oldest: Date | null }
>

/** Desde dónde se abrió Administrar (`?desde=`). */
export type AdminOrigin = 'menu' | 'profile' | 'digest' | 'other'

/** Desde dónde se abrió una ficha (`?desde=`). */
export type RecordOrigin = 'identity' | 'pets' | 'reports' | 'suspended' | 'search' | 'other'
