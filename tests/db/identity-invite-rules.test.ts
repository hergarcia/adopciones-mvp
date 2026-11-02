// Las reglas de la invitación a verificar la identidad en la base (historia #281).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { URUGUAY_TIME_ZONE } from '../../src/lib/verification/rules'
import { dismissAs, dismissalOf, invitePeople, submitFrom } from './identity-invite-support'
import { withdraw } from './identity-support'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { owner } = invitePeople(cleanups)

function uruguayToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: URUGUAY_TIME_ZONE }).format(new Date())
}

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function originOf(userId: string): Promise<string | null> {
  const { data, error } = await db()
    .from('identity_requests')
    .select('origin')
    .eq('user_id', userId)
    .maybeSingle()
  expect(error).toBeNull()
  return data?.origin ?? null
}

describeDb('el origen del pedido de verificación', () => {
  // Covers: US1-AS2, FR-012
  it('desde la invitación se guarda `my_pets` y retirarlo lo devuelve', async () => {
    const carla = await owner()
    const { data, error } = await submitFrom(carla.id, 'my_pets')
    expect(error).toBeNull()
    expect(data?.[0]?.decision).toBe('sent')
    expect(await originOf(carla.id)).toBe('my_pets')

    expect(await withdraw(carla.id)).toMatchObject({
      decision: 'withdrawn',
      request_origin: 'my_pets',
    })
    expect(await originOf(carla.id)).toBeNull()
  })

  // Covers: FR-012
  it('un origen desconocido lo rechaza la base', async () => {
    const carla = await owner()
    const { error } = await submitFrom(carla.id, 'my_wall')
    expect(error).not.toBeNull()
    expect(await originOf(carla.id)).toBeNull()
  })
})

describeDb('«Ahora no» de la invitación', () => {
  // Covers: US2-AS1, US2-AS2, FR-015, FR-022
  it('guarda el día de Uruguay y nada más', async () => {
    const carla = await owner()
    expect(await dismissAs(carla.client)).toEqual({ outcome: 'dismissed', error: null })
    expect(await dismissalOf(carla.id)).toEqual({
      person_id: carla.id,
      dismissed_on: uruguayToday(),
    })
  })

  // Covers: US2-AS5, FR-017
  it('tocarlo otra vez o en dos pestañas deja un solo día, el primero', async () => {
    const carla = await owner()
    const [first, second] = await Promise.all([dismissAs(carla.client), dismissAs(carla.client)])
    expect([first.outcome, second.outcome]).toEqual(
      expect.arrayContaining(['already', 'dismissed']),
    )

    const { error } = await db()
      .from('identity_invite_dismissals')
      .update({ dismissed_on: '2026-10-01' })
      .eq('person_id', carla.id)
    expect(error).toBeNull()
    expect(await dismissAs(carla.client)).toEqual({ outcome: 'already', error: null })
    expect(await dismissalOf(carla.id)).toEqual({ person_id: carla.id, dismissed_on: '2026-10-01' })

    const { count } = await db()
      .from('identity_invite_dismissals')
      .select('person_id', { count: 'exact', head: true })
      .eq('person_id', carla.id)
    expect(count).toBe(1)
  })

  // Covers: FR-015 (sin sesión no hay a quién guardarle la marca)
  it('el visitante anónimo no puede tocarlo', async () => {
    const { outcome, error } = await dismissAs(anonClient())
    expect(outcome).toBeNull()
    expect(error?.code).toBe('42501')
  })

  // Covers: FR-022
  it('borrar la cuenta borra la marca', async () => {
    const carla = await owner()
    expect((await dismissAs(carla.client)).outcome).toBe('dismissed')
    const { error } = await serviceClient().auth.admin.deleteUser(carla.id)
    expect(error).toBeNull()
    expect(await dismissalOf(carla.id)).toBeNull()
  })
})
