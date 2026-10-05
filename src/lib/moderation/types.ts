export const REPORT_REASONS = [
  'scam',
  'animal_abuse',
  'sells_animals',
  'impersonation',
  'harassment',
  'other',
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const REPORT_RESOLUTIONS = ['dismissed', 'suspended'] as const
export type ReportResolution = (typeof REPORT_RESOLUTIONS)[number]

/** `unknown`: no se pudo preguntar, y la puerta lo trata como suspendida (research R4). */
export type AccountStanding =
  { kind: 'active' } | { kind: 'suspended'; reason: string; since: string } | { kind: 'unknown' }

/** Qué ve quien mira un perfil público (FR-017, FR-017a). */
export type ProfileView = 'profile' | 'blocked' | 'not_found'

/** Una persona en una lista de quien administra; `null` es una cuenta borrada (FR-033). */
export type ModerationPerson = { name: string; publicId: string; isSuspended: boolean } | null

export type ReportHistoryEntry =
  | {
      kind: 'report'
      reason: ReportReason
      details: string | null
      createdAt: string
      resolution: ReportResolution
      resolvedAt: string
    }
  | {
      kind: 'suspension'
      reason: string
      suspendedAt: string
      liftedAt: string | null
      /** Quién suspendió; null si se borró su cuenta. */
      suspendedBy: string | null
    }

export type ReportQueueItem = {
  id: string
  reason: ReportReason
  details: string | null
  createdAt: string
  reporter: ModerationPerson
  reported: { name: string; publicId: string; isSuspended: boolean }
  history: ReportHistoryEntry[]
}

export type ReportQueue = {
  items: ReportQueueItem[]
  /** Los reportes sobre quien mira: solo cuántos, sin nada más (FR-010). */
  ownCount: number
}

export type SuspendedAccount = {
  suspensionId: string
  name: string
  publicId: string
  reason: string
  suspendedAt: string
  suspendedBy: string | null
}

export type MyBlock = {
  name: string
  publicId: string
  hasPhoto: boolean
  since: string
}
