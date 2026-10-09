import type { PersonRecord, RecordPet, RecordReport, RecordSuspension } from '@/lib/admin/types'
import { REPORT_REASONS, REPORT_RESOLUTIONS } from '@/lib/moderation/types'
import { PET_STATES, TAKEDOWN_REASONS } from '@/lib/pets/types'
import { REJECTION_REASONS } from '@/lib/verification/identity'
import type { VerificationLevel } from '@/lib/verification/level'
import { isDepartmentCode } from '@/lib/zones/departments'
import { oneOf } from './pet-rows'

// `admin_person_record` devuelve un documento jsonb por parte (research R4): esto lo pasa al dominio
// clave por clave, así lo que la base mande de más no llega a la pantalla.

type Doc = object

function doc(value: unknown): Doc | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null
}

function list(value: unknown): Doc[] {
  return Array.isArray(value) ? value.flatMap((item: unknown) => doc(item) ?? []) : []
}

function text(item: Doc, key: string): string | null {
  const value: unknown = Reflect.get(item, key)
  return typeof value === 'string' ? value : null
}

function date(item: Doc, key: string): Date | null {
  const value = text(item, key)
  return value === null ? null : new Date(value)
}

function count(item: Doc, key: string): number {
  const value: unknown = Reflect.get(item, key)
  return typeof value === 'number' ? value : 0
}

function level(value: number): VerificationLevel {
  return value === 1 || value === 2 || value === 3 ? value : 0
}

function toReport(item: Doc): RecordReport {
  const resolution = text(item, 'resolution')
  return {
    reason: oneOf(REPORT_REASONS, text(item, 'reason') ?? '', 'motivo'),
    details: text(item, 'details'),
    createdAt: date(item, 'created_at') ?? new Date(0),
    resolvedAt: date(item, 'resolved_at'),
    resolution: resolution === null ? null : oneOf(REPORT_RESOLUTIONS, resolution, 'resolución'),
  }
}

function toSuspension(item: Doc): RecordSuspension {
  return {
    reason: text(item, 'reason') ?? '',
    suspendedAt: date(item, 'suspended_at') ?? new Date(0),
    suspendedBy: text(item, 'suspended_by_name'),
    liftedAt: date(item, 'lifted_at'),
    liftedBy: text(item, 'lifted_by_name'),
  }
}

function toPet(item: Doc): RecordPet {
  const takedown = text(item, 'takedown_reason')
  return {
    code: text(item, 'code') ?? '',
    name: text(item, 'name') ?? '',
    state: oneOf(PET_STATES, text(item, 'state') ?? '', 'estado'),
    pendingReview: Reflect.get(item, 'pending_review') === true,
    takedownReason: takedown === null ? null : oneOf(TAKEDOWN_REASONS, takedown, 'motivo de baja'),
    publishedAt: date(item, 'published_at') ?? new Date(0),
  }
}

export function toPersonRecord(row: {
  person: unknown
  identity: unknown
  reports: unknown
  suspensions: unknown
  pets: unknown
}): PersonRecord {
  const person = doc(row.person) ?? {}
  const identity = doc(row.identity) ?? {}
  const reports = doc(row.reports) ?? {}
  const suspension = doc(Reflect.get(person, 'suspension'))
  const open = doc(Reflect.get(identity, 'open'))
  const department = text(person, 'department') ?? ''

  return {
    person: {
      publicId: text(person, 'public_id') ?? '',
      name: text(person, 'display_name') ?? '',
      avatarPath: text(person, 'avatar_path'),
      department: isDepartmentCode(department) ? department : null,
      locality: text(person, 'locality') ?? '',
      memberSince: date(person, 'created_at') ?? new Date(0),
      level: level(count(person, 'level')),
      isSelf: Reflect.get(person, 'is_self') === true,
      suspension:
        suspension === null
          ? null
          : {
              id: text(suspension, 'id') ?? '',
              reason: text(suspension, 'reason') ?? '',
              suspendedAt: date(suspension, 'suspended_at') ?? new Date(0),
              suspendedBy: text(suspension, 'suspended_by_name'),
            },
    },
    identity: {
      verifiedOn: text(identity, 'verified_on'),
      open:
        open === null
          ? null
          : {
              id: text(open, 'id') ?? '',
              sentAt: date(open, 'sent_at') ?? new Date(0),
              isOwn: Reflect.get(open, 'is_own') === true,
            },
      rejections: list(Reflect.get(identity, 'rejections')).map((item) => ({
        rejectedOn: text(item, 'rejected_on') ?? '',
        reason: oneOf(REJECTION_REASONS, text(item, 'reason') ?? '', 'motivo de rechazo'),
      })),
      expiredOn: text(identity, 'expired_on'),
    },
    reports: {
      ownOpen: count(reports, 'own_open'),
      items: list(Reflect.get(reports, 'items')).map(toReport),
    },
    suspensions: list(row.suspensions).map(toSuspension),
    pets: list(row.pets).map(toPet),
  }
}
