// Las reglas de la invitación a verificar la identidad en la base (historia #281).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { invitePeople, submitFrom } from './identity-invite-support'
import { withdraw } from './identity-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { owner } = invitePeople(cleanups)

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
