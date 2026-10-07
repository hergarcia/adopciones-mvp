import { cache } from 'react'
import {
  APPLICATION_STATUSES,
  PUBLISHER_CLOSES,
  type Applicant,
  type Contact,
  type InboxPet,
  type PetApplicationRow,
  type PublisherApplication,
} from '@/lib/applications/types'
import { REVOCATION_REASONS } from '@/lib/applications/rejection'
import { SEXES, type Sex } from '@/lib/pets/options'
import { PET_STATES, type PetPhotoData, type PetState } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { UUID, answersOf, signCovers, type CoverColumns } from './applications'
import { signAvatarsAsService } from './avatars'
import { oneOf, zoneOf } from './pet-rows'

// Lo que el publicador lee de las solicitudes y el contacto de una aceptada (historia #65): con la
// sesión, así cada función vuelve a preguntar quién es y lo ajeno da cero filas (FR-001). Las
// escrituras están en `application-response-records.ts`.

function coverOf(row: CoverColumns, signed: Map<string, PetPhotoData>): PetPhotoData | null {
  return row.cover_id === null ? null : (signed.get(row.cover_id) ?? null)
}

function levelOf(value: number | null): Applicant['level'] {
  return value === 1 || value === 2 || value === 3 ? value : 0
}

type ApplicantColumns = {
  applicant_public_id: string | null
  applicant_name: string | null
  applicant_avatar_path: string | null
  applicant_department: string | null
  applicant_locality: string | null
  applicant_level: number | null
}

function applicantOf(row: ApplicantColumns, avatars: Map<string, string>): Applicant | null {
  if (row.applicant_public_id === null || row.applicant_name === null) return null
  return {
    publicId: row.applicant_public_id,
    name: row.applicant_name,
    avatar:
      row.applicant_avatar_path === null ? null : (avatars.get(row.applicant_avatar_path) ?? null),
    zone: zoneOf({
      department: row.applicant_department ?? '',
      locality: row.applicant_locality ?? '',
    }),
    level: levelOf(row.applicant_level),
  }
}

async function signAvatars(rows: ApplicantColumns[]): Promise<Map<string, string>> {
  return signAvatarsAsService(rows.flatMap((row) => row.applicant_avatar_path ?? []))
}

function closeOf(value: string | null) {
  return value === null ? null : oneOf(PUBLISHER_CLOSES, value, 'cierre')
}

/** Solicitudes: los animales con solicitudes, sin orden (lo da `inboxOrder`). Lanza si la base falla. */
export async function listPublisherInbox(): Promise<InboxPet[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('publisher_inbox')
  if (error) throw new Error('No se pudo traer la bandeja', { cause: error })
  const signed = await signCovers(data)
  return data.map((row) => ({
    petId: row.pet_id,
    code: row.code,
    name: row.name,
    cover: coverOf(row, signed),
    waiting: row.waiting_count,
    fresh: row.new_count,
    lastSentAt: row.last_sent_at,
  }))
}

export type NewCounts = Map<string, { fresh: number; total: number }>

/** Cuántas nuevas tiene cada animal, para Mis animales; vacío si la base no respondió. */
export async function getPublisherNewCounts(): Promise<NewCounts> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('publisher_new_counts')
  if (error) return new Map()
  return new Map(
    data.map((row) => [row.pet_id, { fresh: row.new_count, total: row.total_count }] as const),
  )
}

export type InboxPetHeader = {
  petId: string
  code: string
  name: string
  sex: Sex
  state: PetState
  cover: PetPhotoData | null
}

/** El animal de «Solicitudes por Tobi», si es de quien mira; null si no. Lanza si la base falla. */
export const getInboxPet = cache(async (petId: string): Promise<InboxPetHeader | null> => {
  if (!UUID.test(petId)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('inbox_pet', { p_pet: petId })
  if (error) throw new Error('No se pudo traer el animal', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  const signed = await signCovers([row])
  return {
    petId: row.pet_id,
    code: row.code,
    name: row.name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    state: oneOf(PET_STATES, row.state, 'estado'),
    cover: coverOf(row, signed),
  }
})

/** Las de un animal suyo, sin orden (lo da `petApplicationsOrder`). Lanza si la base falla. */
export async function listPetApplications(petId: string): Promise<PetApplicationRow[]> {
  if (!UUID.test(petId)) return []
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('pet_applications', { p_pet: petId })
  if (error) throw new Error('No se pudieron traer las solicitudes', { cause: error })
  const avatars = await signAvatars(data)
  return data.map((row) => ({
    id: row.id,
    status: oneOf(APPLICATION_STATUSES, row.status, 'estado'),
    publisherClose: closeOf(row.publisher_close ?? null),
    sentAt: row.sent_at,
    changedAt: row.changed_at,
    isNew: row.is_new,
    waitingQuestion: row.waiting_question,
    applicant: applicantOf(row, avatars),
    keyAnswers: answersOf({
      housing_type: row.housing_type,
      outdoor_space: row.outdoor_space,
      hours_alone: row.hours_alone,
    }),
  }))
}

function rejectionOf(
  reason: string | null,
  note: string | null,
): PublisherApplication['rejection'] {
  return reason === null ? null : { reason: oneOf(REVOCATION_REASONS, reason, 'motivo'), note }
}

/** Una para el publicador, o null: la ajena se ve como inexistente (FR-001). Lanza si la base falla. */
export const getPublisherApplication = cache(
  async (id: string): Promise<PublisherApplication | null> => {
    if (!UUID.test(id)) return null
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('publisher_application', { p_id: id })
    if (error) throw new Error('No se pudo traer la solicitud', { cause: error })
    const row = data[0]
    if (row === undefined) return null
    const [signed, avatars] = await Promise.all([signCovers([row]), signAvatars([row])])
    // Los tipos generados no saben que una columna de una función puede ser nula.
    const petId: string | null = row.pet_id ?? null
    const code: string | null = row.pet_code ?? null
    const state: string | null = row.pet_state ?? null
    return {
      id: row.id,
      status: oneOf(APPLICATION_STATUSES, row.status, 'estado'),
      publisherClose: closeOf(row.publisher_close ?? null),
      sentAt: row.sent_at,
      changedAt: row.changed_at,
      pet:
        petId === null || code === null || state === null
          ? null
          : { id: petId, code, state: oneOf(PET_STATES, state, 'estado') },
      petName: row.pet_name,
      petSex: row.pet_sex ?? null,
      cover: coverOf(row, signed),
      applicant: applicantOf(row, avatars),
      answers: row.answers === null ? null : answersOf(row.answers),
      openedAt: row.opened_at ?? null,
      acceptedAt: row.accepted_at ?? null,
      rejection: rejectionOf(row.rejection_reason ?? null, row.rejection_note ?? null),
      applicantHasPhone: row.applicant_has_phone,
      publisherHasPhone: row.publisher_has_phone,
      questionsAsked: row.questions_asked,
      questionPending: row.question_pending,
    }
  },
)

/** El contacto de la otra persona, con la sesión; null si no corresponde verlo (FR-018). */
export const getApplicationContact = cache(async (id: string): Promise<Contact | null> => {
  if (!UUID.test(id)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('application_contact', { p_id: id })
  if (error) throw new Error('No se pudo traer el contacto', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  return {
    name: row.name,
    phone: row.phone ?? null,
    side: row.side === 'applicant' ? 'applicant' : 'publisher',
    viewerName: row.viewer_name ?? '',
    petName: row.pet_name,
  }
})
