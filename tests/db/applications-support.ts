// Lo que comparten las pruebas de las solicitudes en la base (historia #63): personas en el nivel
// pedido, un publicador con un animal en el estado pedido, quien administra, y una solicitud
// escrita **directo con el servicio**, así una user story no depende de las funciones de otra.
import { expect } from 'vitest'
import type { PetState } from '../../src/lib/pets/types'
import type { Database, Json } from '../../src/lib/supabase/types'
import { DB_RULES } from '../../src/lib/verification/rules'
import { setState } from './lifecycle-support'
import { listPet, type ListedPet } from './listing-support'
import { moderationPeople, type Person } from './moderation-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

export type { Person }
export type Submitted = Functions['submit_application']['Returns'][number]
export type Context = Functions['apply_context']['Returns'][number]
export type MineRow = Functions['my_applications']['Returns'][number]
export type DetailRow = Functions['my_application']['Returns'][number]
export type ViewRow = Functions['pet_application_view']['Returns'][number]
type Client = SyntheticUser['client']
type Row = Database['public']['Tables']['applications']['Row']

export const PENDING_TTL = DB_RULES.p_pending_ttl

/** Válidas para un animal castrado y una vivienda propia. */
export const ANSWERS: Record<string, string> = {
  housing_type: 'apartment',
  housing_tenure: 'owned',
  outdoor_space: 'netted_balcony',
  household: 'Mi pareja y yo.',
  other_pets: 'Ninguno.',
  hours_alone: '4_to_8',
  moving_plan: 'Se viene conmigo.',
  experience: 'Tuve una perra doce años.',
  vet_budget: 'tight',
  why_this_pet: 'Porque es tranquilo.',
}

export type PetOptions = {
  state?: PetState
  neutered?: boolean
  requiredLevel?: 1 | 2
  name?: string
}

export function applicationPeople(cleanups: SyntheticUser['cleanup'][]) {
  const { person, admin } = moderationPeople(cleanups)
  return {
    person,
    admin,
    /** Un publicador con nivel 1 y un animal suyo, disponible y castrado salvo que se pida otra cosa. */
    publisherWithPet: async (options: PetOptions = {}) => {
      const publisher = await person(1, 'Quien publica')
      return { publisher, pet: await petOf(publisher, options) }
    },
  }
}

export async function petOf(owner: { id: string }, options: PetOptions = {}): Promise<ListedPet> {
  const pet = await listPet(owner.id, {
    fields: { is_neutered: options.neutered ?? true, name: options.name ?? 'Tobi' },
  })
  if (options.requiredLevel === 2) {
    const { error } = await db().from('pets').update({ required_level: 2 }).eq('id', pet.petId)
    expect(error).toBeNull()
  }
  if (options.state !== undefined && options.state !== 'available') {
    await setState(pet.petId, options.state)
  }
  return pet
}

/** Enviar como lo hace la aplicación: con el servicio y el id de quien solicita. */
export async function submit(
  applicant: { id: string },
  code: string,
  options: { attempt?: string; answers?: Json } = {},
): Promise<Submitted> {
  const { data, error } = await db().rpc('submit_application', {
    p_applicant: applicant.id,
    p_attempt: options.attempt ?? crypto.randomUUID(),
    p_code: code,
    p_answers: options.answers ?? ANSWERS,
    p_pending_ttl: PENDING_TTL,
  })
  expect(error).toBeNull()
  return firstRow(data, 'submit_application')
}

/** Una solicitud escrita directo con el servicio, sin pasar por `submit_application`. */
export async function insertApplication(
  applicant: { id: string },
  pet: ListedPet,
  publisher: { id: string },
  row: Partial<Pick<Row, 'status' | 'close_reason' | 'pet_name'>> = {},
): Promise<string> {
  const { data, error } = await db()
    .from('applications')
    .insert({
      applicant_id: applicant.id,
      pet_id: pet.petId,
      publisher_id: publisher.id,
      attempt_id: crypto.randomUUID(),
      answers: ANSWERS,
      pet_name: row.pet_name ?? 'Tobi',
      status: row.status ?? 'sent',
      close_reason: row.close_reason ?? null,
    })
    .select('id')
    .single()
  expect(error).toBeNull()
  return data?.id ?? ''
}

/** Las filas de una persona, leídas con el servicio. */
export async function applicationsOf(applicantId: string): Promise<Row[]> {
  const { data, error } = await db()
    .from('applications')
    .select('*')
    .eq('applicant_id', applicantId)
    .order('sent_at')
  expect(error).toBeNull()
  return data ?? []
}

export async function contextOf(applicant: { id: string }, code: string): Promise<Context[]> {
  const { data, error } = await db().rpc('apply_context', {
    p_applicant: applicant.id,
    p_code: code,
    p_pending_ttl: PENDING_TTL,
  })
  expect(error).toBeNull()
  return data ?? []
}

/** Lo que una sesión lee de la tabla, directo con su token. */
export async function tableAs(client: Client) {
  const { data, error } = await client.from('applications').select('*')
  return { rows: data ?? [], error }
}

export async function mineAs(client: Client) {
  const { data, error } = await client.rpc('my_applications')
  const rows: MineRow[] = data ?? []
  return { rows, error }
}

export async function detailAs(client: Client, id: string) {
  const { data, error } = await client.rpc('my_application', { p_id: id })
  const rows: DetailRow[] = data ?? []
  return { rows, error }
}

export async function viewAs(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_application_view', { p_code: code })
  const rows: ViewRow[] = data ?? []
  return { rows, error }
}

export type Withdrawn = Functions['withdraw_application']['Returns'][number]

/** Retirar como lo hace la aplicación: con el servicio y el id de quien solicitó. */
export async function withdraw(applicant: { id: string }, id: string): Promise<Withdrawn> {
  const { data, error } = await db().rpc('withdraw_application', {
    p_applicant: applicant.id,
    p_id: id,
  })
  expect(error).toBeNull()
  return firstRow(data, 'withdraw_application')
}
