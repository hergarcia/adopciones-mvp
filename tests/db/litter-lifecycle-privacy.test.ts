// La privacidad de la vida de una camada (historia #206, SC-003): quien fue aceptada para una cría lee
// solo el contacto de quien publicó, y nada de quienes pidieron otra cría por ningún camino; la
// bandeja de la camada es solo de su dueña.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  accept,
  contactAs,
  inboxAs,
  petApplicationsAs,
  publisherViewAs,
  responsePeople,
} from './application-responses-support'
import { applyForYoung, litterWithYoung } from './litter-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = responsePeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

// Una camada con una solicitud aceptada para «Cría 2» y otra esperando para «Cría 1».
async function litterScene() {
  const publisher = await person(1, 'Quien publica')
  const litter = await litterWithYoung(publisher.id, 3)
  const [accepted, other] = await Promise.all([person(1, 'Aceptada'), person(1, 'Otra')])
  const acceptedId = await applyForYoung(accepted, litter.young[1], publisher)
  const otherId = await applyForYoung(other, litter.young[0], publisher)
  expect((await accept(publisher, acceptedId)).outcome).toBe('accepted')
  return { publisher, litter, accepted, acceptedId, other, otherId }
}

describeDb('las solicitudes de cada cría (US1)', () => {
  // Covers: US1-AS5, FR-027, SC-003
  it('quien fue aceptada para una cría no lee nada de quien pidió otra, por ningún camino', async () => {
    const { litter, accepted, otherId } = await litterScene()
    const client = accepted.client

    expect(await petApplicationsAs(client, litter.young[0].id)).toEqual({ rows: [], error: null })
    expect(await petApplicationsAs(client, litter.young[1].id)).toEqual({ rows: [], error: null })
    expect(await inboxAs(client)).toEqual({ rows: [], error: null })
    expect(await publisherViewAs(client, otherId)).toEqual({ rows: [], error: null })
    expect(await contactAs(client, otherId)).toEqual({ rows: [], error: null })
  })

  // Covers: US1-AS3, US1-AS5, FR-027, FR-040
  it('la aceptada ve solo el contacto de quien publicó, y quien publicó el suyo', async () => {
    const { publisher, accepted, acceptedId, other, otherId } = await litterScene()

    const mine = await contactAs(accepted.client, acceptedId)
    expect(mine.rows).toHaveLength(1)
    expect(mine.rows[0]).toMatchObject({ side: 'applicant', name: 'Quien publica' })

    const theirs = await contactAs(publisher.client, acceptedId)
    expect(theirs.rows[0]).toMatchObject({ side: 'publisher', name: 'Aceptada' })

    // La que sigue esperando por otra cría no lee ningún contacto.
    expect(await contactAs(other.client, otherId)).toEqual({ rows: [], error: null })
    expect(await contactAs(other.client, acceptedId)).toEqual({ rows: [], error: null })
  })

  // Covers: FR-027, SC-003 (la bandeja de la camada es solo de su dueña)
  it('otra persona y un visitante no leen la bandeja ni las solicitudes de la camada', async () => {
    const { litter } = await litterScene()
    const stranger = await person(1, 'Cualquiera')

    expect(await inboxAs(stranger.client)).toEqual({ rows: [], error: null })
    for (const young of litter.young) {
      // oxlint-disable-next-line no-await-in-loop -- una cría por vez
      expect(await petApplicationsAs(stranger.client, young.id)).toEqual({ rows: [], error: null })
    }
    const anon = await anonClient().rpc('publisher_inbox')
    expect(anon.data ?? []).toEqual([])
    expect(anon.error).not.toBeNull()
  })
})
