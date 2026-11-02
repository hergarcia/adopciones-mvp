// La privacidad de «Ahora no» de la invitación (historia #281, FR-021, SC-004): la tabla no se lee ni
// se escribe directo por ningún rol, y la función que la lee devuelve solo la marca propia; quien
// administra tampoco ve la de otra persona.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { dismissalOf, dismissed, dismissedAs, invitePeople } from './identity-invite-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { owner, other, admin } = invitePeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('la tabla de «Ahora no»', () => {
  // Covers: FR-021 (nadie la lee directo, tampoco la dueña ni quien administra)
  it('no la lee nadie', async () => {
    const carla = await owner()
    await dismissed(carla.client)
    const diego = await other()
    const reviewer = await admin()

    for (const client of [anonClient(), carla.client, diego.client, reviewer.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const { data } = await client.from('identity_invite_dismissals').select('*')
      expect(data ?? []).toEqual([])
    }
  })

  // Covers: FR-017, FR-021 (la marca entra solo por la función, con el día que pone la base)
  it('no la escribe nadie', async () => {
    const carla = await owner()
    const diego = await other()

    for (const client of [anonClient(), carla.client, diego.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const { error } = await client
        .from('identity_invite_dismissals')
        .insert({ person_id: carla.id, dismissed_on: '2026-01-01' })
      expect(error).not.toBeNull()
    }
    expect(await dismissalOf(carla.id)).toBeNull()
  })
})

describeDb('identity_invite_dismissed', () => {
  // Covers: FR-021, SC-004
  it('el visitante anónimo no la puede llamar', async () => {
    const { dismissed: value, error } = await dismissedAs(anonClient())
    expect(error).not.toBeNull()
    expect(value).toBeNull()
  })

  // Covers: FR-021, SC-004
  it('otra persona y quien administra reciben false aunque la dueña tocó «Ahora no»', async () => {
    const carla = await owner()
    await dismissed(carla.client)
    const diego = await other()
    const reviewer = await admin()

    for (const client of [diego.client, reviewer.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      expect(await dismissedAs(client)).toEqual({ dismissed: false, error: null })
    }
  })

  // Covers: US1-AS1, US2-AS2, FR-001
  it('la dueña recibe true solo después de tocarlo', async () => {
    const carla = await owner()
    expect(await dismissedAs(carla.client)).toEqual({ dismissed: false, error: null })
    await dismissed(carla.client)
    expect(await dismissedAs(carla.client)).toEqual({ dismissed: true, error: null })
  })
})
