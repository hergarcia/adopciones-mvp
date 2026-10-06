import { cache } from 'react'
import type { ApplicantLevel } from '@/lib/analytics/events'
import { QUESTION_IDS, type Answers } from '@/lib/applications/questionnaire'
import { SUBMIT_OUTCOMES, type SubmitOutcomeKind } from '@/lib/applications/submit-outcome'
import {
  APPLICATION_STATUSES,
  CLOSE_REASONS,
  RECEIVING,
  type ApplicationDetail,
  type ActiveApplication,
  type ApplicationSummary,
  type ApplyContext,
  type ApplyPet,
} from '@/lib/applications/types'
import { PET_CODE_PATTERN } from '@/lib/pets/rules'
import type { PetPhotoData } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import { signPetPhotosAsService, type StoredPhoto } from './pet-photos'
import { oneOf } from './pet-rows'

// Las solicitudes (historia #63). Lo de quien solicita va con permisos de servicio y su id como
// parámetro, que sale de la sesión en el servidor (research R1); lo que lee de lo suyo, con su
// sesión, así la RLS y la función vuelven a preguntar quién es.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

type CoverColumns = {
  cover_id: string | null
  cover_owner: string | null
  cover_width: number | null
  cover_height: number | null
  cover_thumbhash: string | null
}

function storedCover(row: CoverColumns): StoredPhoto | null {
  if (row.cover_id === null || row.cover_owner === null) return null
  return {
    id: row.cover_id,
    ownerId: row.cover_owner,
    width: row.cover_width ?? 0,
    height: row.cover_height ?? 0,
    thumbhash: row.cover_thumbhash ?? '',
  }
}

async function signCovers(rows: CoverColumns[]): Promise<Map<string, PetPhotoData>> {
  return signPetPhotosAsService(rows.flatMap((row) => storedCover(row) ?? []))
}

function answersOf(value: unknown): Answers {
  const answers: Answers = {}
  if (typeof value !== 'object' || value === null) return answers
  for (const id of QUESTION_IDS) {
    const answer: unknown = Reflect.get(value, id)
    if (typeof answer === 'string') answers[id] = answer
  }
  return answers
}

function levelOf(value: number): ApplicantLevel {
  return value === 1 || value === 2 || value === 3 ? value : 0
}

export type ApplyScreen = {
  context: ApplyContext
  pet: ApplyPet
  level: ApplicantLevel
  /** Las respuestas de la última que mandó, cualquiera sea su estado (FR-025). */
  lastAnswers: Answers | null
  /** Sus activas, de la más reciente a la más vieja: las de la pantalla del límite (FR-051). */
  active: ActiveApplication[]
}

function nullableString(source: object, key: string): string | null {
  const value: unknown = Reflect.get(source, key)
  return typeof value === 'string' ? value : null
}

function nullableNumber(source: object, key: string): number | null {
  const value: unknown = Reflect.get(source, key)
  return typeof value === 'number' ? value : null
}

// `active` llega como jsonb: se lee campo por campo y lo que no tiene id o fecha se descarta.
function activeRowsOf(
  value: unknown,
): (CoverColumns & { id: string; sentAt: string; code: string | null; name: string })[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return []
    const id = nullableString(item, 'id')
    const sentAt = nullableString(item, 'sent_at')
    if (id === null || sentAt === null) return []
    return [
      {
        id,
        sentAt,
        code: nullableString(item, 'code'),
        name: nullableString(item, 'name') ?? '',
        cover_id: nullableString(item, 'cover_id'),
        cover_owner: nullableString(item, 'cover_owner'),
        cover_width: nullableNumber(item, 'cover_width'),
        cover_height: nullableNumber(item, 'cover_height'),
        cover_thumbhash: nullableString(item, 'cover_thumbhash'),
      },
    ]
  })
}

/** Todo lo de la pantalla de «Quiero adoptar», o null si el animal no existe. Lanza si la base falla. */
export async function getApplyScreen(
  applicantId: string,
  code: string,
): Promise<ApplyScreen | null> {
  if (!PET_CODE_PATTERN.test(code)) return null
  const { data, error } = await createServiceSupabase().rpc('apply_context', {
    p_applicant: applicantId,
    p_code: code,
    p_pending_ttl: DB_RULES.p_pending_ttl,
  })
  if (error) throw new Error('No se pudo abrir el cuestionario', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  const active = activeRowsOf(row.active)
  const signed = await signCovers([row, ...active])
  return {
    context: {
      isOwner: row.is_owner,
      receiving: oneOf(RECEIVING, row.receiving, 'recibe'),
      inProcess: row.state === 'in_process',
      blockedByPublisher: row.blocked_by_publisher,
      blockedPublisher: row.blocked_publisher,
      // Los tipos generados no saben que una columna de una función puede ser nula.
      myActiveId: row.my_active_id ?? null,
      activeCount: row.active_count,
      levelOne: row.level_one,
      levelTwo: row.level_two,
      requiredLevel: row.required_level === 2 ? 2 : 1,
    },
    pet: {
      code: row.code,
      name: row.name,
      isNeutered: row.is_neutered,
      publisherName: row.publisher_name ?? null,
      cover: row.cover_id === null ? null : (signed.get(row.cover_id) ?? null),
    },
    level: levelOf(row.level),
    lastAnswers: row.last_answers === null ? null : answersOf(row.last_answers),
    active: active.map((item) => ({
      id: item.id,
      sentAt: item.sentAt,
      code: item.code,
      name: item.name,
      cover: item.cover_id === null ? null : (signed.get(item.cover_id) ?? null),
    })),
  }
}

/** Nulo si la base no respondió: la cadena termina en una acción, que no lanza. */
export async function submitApplicationRecord(input: {
  applicantId: string
  attemptId: string
  code: string
  answers: Answers
}): Promise<{ outcome: SubmitOutcomeKind; id: string | null } | null> {
  const { data, error } = await createServiceSupabase().rpc('submit_application', {
    p_applicant: input.applicantId,
    p_attempt: input.attemptId,
    p_code: input.code,
    p_answers: input.answers,
    p_pending_ttl: DB_RULES.p_pending_ttl,
  })
  const row = error ? undefined : data[0]
  const outcome = SUBMIT_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  return { outcome, id: row.application_id ?? null }
}

export const WITHDRAW_OUTCOMES = ['withdrawn', 'already_withdrawn', 'closed', 'not_found'] as const
export type WithdrawOutcome = (typeof WITHDRAW_OUTCOMES)[number]

export type WithdrawRecord = {
  outcome: WithdrawOutcome
  /** Solo de una retirada ahora: para medir los días y refrescar la ficha. */
  sentAt: string | null
  code: string | null
}

/** Retirar una de quien tiene la sesión; nulo si la base no respondió. */
export async function withdrawApplicationRecord(
  applicantId: string,
  id: string,
): Promise<WithdrawRecord | null> {
  if (!UUID.test(id)) return { outcome: 'not_found', sentAt: null, code: null }
  const { data, error } = await createServiceSupabase().rpc('withdraw_application', {
    p_applicant: applicantId,
    p_id: id,
  })
  const row = error ? undefined : data[0]
  const outcome = WITHDRAW_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  return { outcome, sentAt: row.sent_at ?? null, code: row.code ?? null }
}

/** El id de la solicitud que mandó ese intento, null si no mandó, undefined si no se pudo saber. */
export async function checkApplicationAttemptRecord(
  applicantId: string,
  attemptId: string,
): Promise<string | null | undefined> {
  if (!UUID.test(attemptId)) return null
  const { data, error } = await createServiceSupabase().rpc('check_application_attempt', {
    p_applicant: applicantId,
    p_attempt: attemptId,
  })
  if (error) return undefined
  return data ?? null
}

type SummaryRow = CoverColumns & {
  id: string
  status: string
  close_reason: string | null
  sent_at: string
  changed_at: string
  code: string | null
  pet_name: string
  pet_on_view: boolean
}

function summaryOf(row: SummaryRow, signed: Map<string, PetPhotoData>): ApplicationSummary {
  return {
    id: row.id,
    status: oneOf(APPLICATION_STATUSES, row.status, 'estado'),
    closeReason:
      row.close_reason === null ? null : oneOf(CLOSE_REASONS, row.close_reason, 'motivo'),
    sentAt: row.sent_at,
    changedAt: row.changed_at,
    code: row.code ?? null,
    petName: row.pet_name,
    cover: row.cover_id === null ? null : (signed.get(row.cover_id) ?? null),
    petOnView: row.pet_on_view,
  }
}

/** Mis solicitudes, con la sesión: las activas primero (FR-071). Lanza si la base falla. */
export async function listMyApplications(): Promise<ApplicationSummary[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('my_applications')
  if (error) throw new Error('No se pudieron traer las solicitudes', { cause: error })
  const signed = await signCovers(data)
  return data.map((row) => summaryOf(row, signed))
}

/** Una de quien tiene la sesión, o null: la ajena se ve como inexistente (FR-070). */
export const getMyApplication = cache(async (id: string): Promise<ApplicationDetail | null> => {
  if (!UUID.test(id)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('my_application', { p_id: id })
  if (error) throw new Error('No se pudo traer la solicitud', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  const signed = await signCovers([row])
  return {
    ...summaryOf(row, signed),
    answers: answersOf(row.answers),
    publisherName: row.publisher_name ?? null,
  }
})

export type PetApplicationView = {
  requiredLevel: 1 | 2
  receives: boolean
  myActiveId: string | null
}

/** Lo que la ficha necesita para «Quiero adoptar» (R8), con la sesión de quien mira o sin ella. */
export async function getPetApplicationView(code: string): Promise<PetApplicationView | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('pet_application_view', { p_code: code })
  if (error) throw new Error('No se pudo saber si recibe solicitudes', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  return {
    requiredLevel: row.required_level === 2 ? 2 : 1,
    receives: row.receives,
    myActiveId: row.my_active_id ?? null,
  }
}
