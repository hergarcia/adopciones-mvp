import { SEXES, type Sex } from '@/lib/pets/options'
import { RENEWAL_OUTCOMES, type RenewalOutcome, type RenewalPet } from '@/lib/pets/renewal-result'
import { PET_STATES, PET_STATUSES, type PetStatus } from '@/lib/pets/types'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import { PET_PHOTOS_BUCKET, objectPath } from './pet-photos'
import { oneOf } from './pet-rows'

// El recordatorio y su enlace (historia #59, research R4 y R5). Todo con permisos de servicio: lo
// llaman la tarea programada y las rutas del enlace, que no tienen sesión. Una falla de la base lanza.

export type DueReminder = {
  petId: string
  ownerId: string
  name: string
  sex: Sex
  expiresAt: Date
}

/** Marca y devuelve los recordatorios debidos: cada vencimiento, una sola vez. */
export async function claimPetReminders(limit: number): Promise<DueReminder[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_pet_reminders', {
    p_limit: limit,
  })
  if (error) throw new Error('No se pudieron tomar los recordatorios', { cause: error })
  return data.map((row) => ({
    petId: row.pet_id,
    ownerId: row.owner_id,
    name: row.name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    expiresAt: new Date(row.expires_at),
  }))
}

export type CountedExpiry = { status: PetStatus; publishedAt: Date }

/** Marca y devuelve las vencidas que todavía no se midieron. */
export async function claimPetExpiries(limit: number): Promise<CountedExpiry[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_pet_expiries', {
    p_limit: limit,
  })
  if (error) throw new Error('No se pudieron tomar las vencidas', { cause: error })
  return data.map((row) => ({
    status: oneOf(PET_STATUSES, row.status, 'estado'),
    publishedAt: new Date(row.published_at),
  }))
}

export async function createRenewalLink(petId: string, tokenHash: string): Promise<void> {
  const { error } = await createServiceSupabase().rpc('create_pet_renewal_link', {
    p_pet: petId,
    p_token_hash: tokenHash,
  })
  if (error) throw new Error('No se pudo crear el enlace', { cause: error })
}

export async function renewByLink(tokenHash: string): Promise<RenewalOutcome> {
  const { data, error } = await createServiceSupabase().rpc('renew_by_link', {
    p_token_hash: tokenHash,
    p_pending_ttl: DB_RULES.p_pending_ttl,
  })
  const row = error ? undefined : data[0]
  if (row === undefined) throw new Error('No se pudo renovar', { cause: error })
  return oneOf(RENEWAL_OUTCOMES, row.outcome, 'resultado')
}

type LinkView = RenewalPet & { cover: { id: string; ownerId: string } | null }

async function linkView(tokenHash: string): Promise<LinkView | null> {
  const { data, error } = await createServiceSupabase().rpc('renewal_link_view', {
    p_token_hash: tokenHash,
  })
  if (error) throw new Error('No se pudo leer el enlace', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  return {
    name: row.name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    state: oneOf(PET_STATES, row.state, 'estado'),
    expiresAt: row.expires_at === null ? null : new Date(row.expires_at),
    cover:
      row.cover_id === null || row.cover_owner === null
        ? null
        : { id: row.cover_id, ownerId: row.cover_owner },
  }
}

/** El animal del enlace como está ahora, sin nada de la persona; null si el enlace no sirve. */
export async function getRenewalLinkPet(tokenHash: string): Promise<RenewalPet | null> {
  const view = await linkView(tokenHash)
  if (view === null) return null
  const { cover: _, ...pet } = view
  return pet
}

/** La portada `card` del animal del enlace, en WebP; null si el enlace no sirve o no tiene foto. */
export async function getRenewalLinkCover(tokenHash: string): Promise<Blob | null> {
  const view = await linkView(tokenHash)
  if (view?.cover == null) return null
  const { data } = await createServiceSupabase()
    .storage.from(PET_PHOTOS_BUCKET)
    .download(objectPath(view.cover.ownerId, view.cover.id, 'card'))
  return data
}
