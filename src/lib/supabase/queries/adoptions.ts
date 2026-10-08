import { cache } from 'react'
import {
  ADOPTION_KINDS,
  COMMITMENT_OUTCOMES,
  HANDOVER_OUTCOMES,
  type AdoptionRow,
  type CommitmentOutcome,
  type HandoverCandidate,
  type HandoverOutcome,
  type HandoverPet,
  type PetAdoptionSummary,
} from '@/lib/adoptions/types'
import { SEXES } from '@/lib/pets/options'
import { PET_STATES } from '@/lib/pets/types'
import { publicPhotoPath } from '@/lib/profile/public-paths'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { UUID } from './applications'
import { oneOf } from './pet-rows'

// La entrega y el compromiso de adopción (historia #67). Lo que se lee va con la sesión, así cada
// función vuelve a preguntar quién es y lo ajeno da cero filas (research R2); lo que se escribe, con
// el servicio y el id que sale de la sesión.

function levelOf(value: number | null): HandoverCandidate['level'] {
  return value === 1 || value === 2 || value === 3 ? value : 0
}

/** El animal de «¿A quién se lo diste?», si es de quien mira; null si no. Lanza si la base falla. */
export const getHandoverPet = cache(async (petId: string): Promise<HandoverPet | null> => {
  if (!UUID.test(petId)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('handover_pet', { p_pet: petId })
  if (error) throw new Error('No se pudo traer el animal', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  return {
    petId: row.pet_id,
    name: row.name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    code: row.code,
    state: oneOf(PET_STATES, row.state, 'estado'),
    isNeutered: row.is_neutered,
    publisherName: row.publisher_name ?? '',
  }
})

/** Las aceptadas de un animal suyo, la más vieja primero (FR-001). Lanza si la base falla. */
export async function listHandoverCandidates(petId: string): Promise<HandoverCandidate[]> {
  if (!UUID.test(petId)) return []
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('handover_candidates', { p_pet: petId })
  if (error) throw new Error('No se pudieron traer las aceptadas', { cause: error })
  return data.map((row) => ({
    applicationId: row.application_id,
    publicId: row.applicant_public_id,
    name: row.applicant_name,
    avatar: row.applicant_has_photo ? publicPhotoPath(row.applicant_public_id) : null,
    level: levelOf(row.applicant_level),
    acceptedAt: row.accepted_at ?? null,
  }))
}

/** A quién se entregó cada adoptado suyo, por id del animal; vacío si la base no respondió. */
export async function getMyPetAdoptions(): Promise<Map<string, PetAdoptionSummary>> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('my_pet_adoptions')
  if (error) return new Map()
  return new Map(
    data.map((row) => [
      row.pet_id,
      {
        petId: row.pet_id,
        kind: oneOf(ADOPTION_KINDS, row.kind, 'entrega'),
        adopterName: row.adopter_name ?? null,
        declined: row.declined,
        adopterAcceptedAt: row.adopter_accepted_at ?? null,
        markedAt: row.marked_at,
        endsPerson: row.ends_person,
      },
    ]),
  )
}

/** La adopción de una solicitud, a una de las dos personas; null si no. Lanza si la base falla. */
export const getAdoptionOf = cache(async (applicationId: string): Promise<AdoptionRow | null> => {
  if (!UUID.test(applicationId)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('adoption_of', { p_application: applicationId })
  if (error) throw new Error('No se pudo traer la adopción', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  const sex: string | null = row.pet_sex ?? null
  return {
    side: row.side === 'adopter' ? 'adopter' : 'publisher',
    petName: row.pet_name,
    petSex: sex === null ? 'male' : oneOf(SEXES, sex, 'sexo'),
    includesNeuter: row.includes_neuter ?? false,
    publisherName: row.publisher_name ?? null,
    adopterName: row.adopter_name ?? null,
    markedAt: row.marked_at,
    adopterAcceptedAt: row.adopter_accepted_at ?? null,
    declinedAt: row.declined_at ?? null,
    endedAt: row.ended_at ?? null,
    contactCut: row.contact_cut,
    adopterSuspended: row.adopter_suspended,
  }
})

export type HandoverRecord = {
  outcome: HandoverOutcome
  /** El nombre de la elegida: el aviso de cómo quedó, o «Ana ya no sigue con esta solicitud». */
  person: string | null
  code: string | null
  name: string | null
  sex: (typeof SEXES)[number] | null
  from: (typeof PET_STATES)[number] | null
  publishedAt: Date | null
  acceptedAt: Date | null
  acceptedCount: number
}

/** Marcar adoptado como quien publicó (research R3); nulo si la base no respondió. */
export async function markPetAdoptedRecord(
  ownerId: string,
  input: { petId: string; applicationId: string | null; attemptId: string },
): Promise<HandoverRecord | null> {
  const { data, error } = await createServiceSupabase().rpc('mark_pet_adopted', {
    p_owner: ownerId,
    p_pet: input.petId,
    p_attempt: input.attemptId,
    ...(input.applicationId === null ? {} : { p_application: input.applicationId }),
  })
  const row = error ? undefined : data[0]
  const outcome = HANDOVER_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  const sex: string | null = row.sex ?? null
  const from: string | null = row.from_state ?? null
  const published: string | null = row.published_at ?? null
  const accepted: string | null = row.accepted_at ?? null
  return {
    outcome,
    person: row.detail ?? null,
    code: row.code ?? null,
    name: row.name ?? null,
    sex: sex === null ? null : oneOf(SEXES, sex, 'sexo'),
    from: from === null ? null : oneOf(PET_STATES, from, 'estado'),
    publishedAt: published === null ? null : new Date(published),
    acceptedAt: accepted === null ? null : new Date(accepted),
    acceptedCount: row.accepted_count,
  }
}

/** Aceptar el compromiso como quien adoptó (research R5); nulo si la base no respondió. */
export async function acceptCommitmentRecord(
  adopterId: string,
  applicationId: string,
): Promise<{ outcome: CommitmentOutcome; markedAt: Date | null } | null> {
  const { data, error } = await createServiceSupabase().rpc('accept_commitment', {
    p_adopter: adopterId,
    p_application: applicationId,
  })
  const row = error ? undefined : data[0]
  const outcome = COMMITMENT_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  const marked: string | null = row.marked_at ?? null
  return { outcome, markedAt: marked === null ? null : new Date(marked) }
}

export type CommitmentEmailRow = {
  side: 'publisher' | 'adopter'
  petName: string
  petSex: (typeof SEXES)[number]
  /** El código y la portada, solo mientras el animal se puede mostrar a quien recibe. */
  petCode: string | null
  coverId: string | null
  includesNeuter: boolean
  publisherName: string
  adopterName: string
  markedAt: string
  adopterAcceptedAt: string | null
}

/** Lo que lleva el correo del compromiso a una de las dos (research R7); null si no es una de ellas. */
export async function getCommitmentForEmail(
  applicationId: string,
  recipientId: string,
): Promise<CommitmentEmailRow | null> {
  const { data, error } = await createServiceSupabase().rpc('commitment_for_email', {
    p_application: applicationId,
    p_recipient: recipientId,
  })
  const row = error ? undefined : data[0]
  if (row === undefined) return null
  const sex: string | null = row.pet_sex ?? null
  return {
    side: row.side === 'publisher' ? 'publisher' : 'adopter',
    petName: row.pet_name,
    petSex: sex === null ? 'male' : oneOf(SEXES, sex, 'sexo'),
    petCode: row.pet_code ?? null,
    coverId: row.cover_id ?? null,
    includesNeuter: row.includes_neuter ?? false,
    publisherName: row.publisher_name ?? '',
    adopterName: row.adopter_name ?? '',
    markedAt: row.marked_at,
    adopterAcceptedAt: row.adopter_accepted_at ?? null,
  }
}
