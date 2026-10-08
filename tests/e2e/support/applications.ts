import { expect } from '@playwright/test'
import { service } from './pet-owner'

// Lo que comparten las pruebas de solicitudes (historias #65 y #67): mandar una con la función de la
// base, como la manda el sitio, y el teléfono verificado de una persona como lo escribe la pantalla.

// `extra`: las respuestas que dependen del animal, como la de castrarlo si no está castrado.
export async function sendApplication(
  applicantId: string,
  code: string,
  extra: Record<string, string> = {},
): Promise<string> {
  const { data, error } = await service().rpc('submit_application', {
    p_applicant: applicantId,
    p_attempt: crypto.randomUUID(),
    p_code: code,
    p_answers: {
      housing_type: 'apartment',
      housing_tenure: 'owned',
      outdoor_space: 'netted_balcony',
      household: 'Mi pareja y yo.',
      other_pets: 'Ninguno.',
      hours_alone: '4_to_8',
      moving_plan: 'Se viene conmigo.',
      experience: 'Una perra, doce años.',
      vet_budget: 'tight',
      why_this_pet: 'Porque es tranquilo.',
      ...extra,
    },
    p_pending_ttl: '7 days',
  })
  expect(error).toBeNull()
  const row: unknown = data?.[0]
  expect(row).toMatchObject({ outcome: 'sent' })
  return String(Reflect.get(Object(row), 'application_id'))
}

export async function verifiedNumber(userId: string): Promise<string> {
  const { data } = await service()
    .from('phones')
    .select('verified_number')
    .eq('user_id', userId)
    .single()
  return String(data?.verified_number ?? '')
}

// «099 123 456» a partir de +59899123456, como lo escribe la pantalla.
export function written(e164: string): string {
  const national = `0${e164.slice(4)}`
  return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}

/** Aceptar una solicitud como el publicador, con la función de la base. */
export async function acceptApplication(publisherId: string, id: string): Promise<void> {
  const { data, error } = await service().rpc('accept_application', {
    p_publisher: publisherId,
    p_id: id,
  })
  expect(error).toBeNull()
  expect(data?.[0]).toMatchObject({ outcome: 'accepted' })
}
