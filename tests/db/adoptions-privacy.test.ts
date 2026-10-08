// Quién puede leer a quién se entregó un animal (historia #67, FR-043, FR-062): solo las dos
// personas de la adopción. Cada prueba intenta leerlo como alguien que no debe verlo: un visitante,
// otra persona con sesión, la otra aceptada del mismo animal y quien administra. Y el teléfono queda
// solo para el par (FR-030). La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { contactAs } from './application-responses-support'
import {
  adoptionOfAs,
  adoptionPeople,
  candidatesAs,
  declineAdoption,
  markAdopted,
  myPetAdoptionsAs,
  type HandoverScene,
} from './adoptions-support'
import { changed } from './lifecycle-support'
import { block, lift, suspend } from './moderation-support'
import { db } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, handoverScene } = adoptionPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function outsiders(other: SyntheticUser) {
  return [
    ['un visitante', anonClient()],
    ['otra persona', (await person(1, 'Otra')).client],
    ['la otra aceptada', other.client],
    ['quien administra', (await admin()).client],
  ] as const
}

describeDb('a quién se entregó, solo para las dos personas (FR-043, FR-062)', () => {
  // Covers: US1-AS1, FR-001 (quien publicó ve sus aceptadas; nadie más)
  it('las aceptadas para elegir: solo quien publicó, la más vieja primero', async () => {
    const scene = await handoverScene()
    const mine = await candidatesAs(scene.publisher.client, scene.pet.petId)
    expect(mine.error).toBeNull()
    expect(mine.rows.map((row) => row.application_id)).toEqual([scene.chosenId, scene.otherId])
    expect(mine.rows[0]).toMatchObject({ applicant_name: 'Ana', applicant_level: 1 })

    for (const [who, client] of await outsiders(scene.other)) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno, para nombrar al que falla
      const { rows } = await candidatesAs(client, scene.pet.petId)
      expect({ who, rows }).toEqual({ who, rows: [] })
    }
  })

  // Covers: US1-AS3, FR-040, FR-043, SC-003
  it('después de marcar: las dos personas leen la adopción; nadie más, ni la tabla', async () => {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)

    const publisherView = await adoptionOfAs(scene.publisher.client, scene.chosenId)
    expect(publisherView.rows).toEqual([
      expect.objectContaining({ side: 'publisher', adopter_name: 'Ana', pet_name: 'Tobi' }),
    ])
    const adopterView = await adoptionOfAs(scene.chosen.client, scene.chosenId)
    expect(adopterView.rows).toEqual([
      expect.objectContaining({ side: 'adopter', publisher_name: 'Quien publica' }),
    ])
    const summaries = await myPetAdoptionsAs(scene.publisher.client)
    expect(summaries.rows).toEqual([
      expect.objectContaining({
        pet_id: scene.pet.petId,
        kind: 'site',
        adopter_name: 'Ana',
        declined: false,
        ends_person: true,
      }),
    ])

    for (const [who, client] of await outsiders(scene.other)) {
      // oxlint-disable-next-line no-await-in-loop
      const of = await adoptionOfAs(client, scene.chosenId)
      // oxlint-disable-next-line no-await-in-loop
      const pets = await myPetAdoptionsAs(client)
      // oxlint-disable-next-line no-await-in-loop
      const table = await client.from('adoptions').select('*')
      expect({ who, of: of.rows, pets: pets.rows, table: table.data ?? [] }).toEqual({
        who,
        of: [],
        pets: [],
        table: [],
      })
    }
    const own = await scene.publisher.client.from('adoptions').select('*')
    expect(own.data ?? []).toEqual([])
  })
})

describeDb('el teléfono después de marcar, solo para el par (FR-030)', () => {
  // Covers: US1-AS4, SC-002
  it('la elegida y quien publicó se siguen viendo; la otra aceptada ya no, de ningún lado', async () => {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)

    const adopter = await contactAs(scene.chosen.client, scene.chosenId)
    expect(adopter.rows).toEqual([expect.objectContaining({ side: 'applicant' })])
    expect(adopter.rows[0]?.phone).not.toBeNull()
    const publisher = await contactAs(scene.publisher.client, scene.chosenId)
    expect(publisher.rows).toEqual([expect.objectContaining({ name: 'Ana', side: 'publisher' })])

    expect((await contactAs(scene.other.client, scene.otherId)).rows).toEqual([])
    expect((await contactAs(scene.publisher.client, scene.otherId)).rows).toEqual([])
  })

  // Covers: US1-AS5, SC-002 (por fuera: nadie sigue viendo el teléfono)
  it('por fuera del sitio: ninguna aceptada ni quien publicó ven un teléfono', async () => {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, null)
    for (const [client, id] of [
      [scene.chosen.client, scene.chosenId],
      [scene.other.client, scene.otherId],
      [scene.publisher.client, scene.chosenId],
      [scene.publisher.client, scene.otherId],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop
      expect((await contactAs(client, id)).rows).toEqual([])
    }
  })
})

describeDb('después de «Yo no adopté» (FR-021, FR-043)', () => {
  // Covers: US3-AS2, FR-021 (el teléfono deja de verse para las dos y el compromiso para ella)
  it('ninguna de las dos ve el teléfono de la otra y quien lo dijo ya no lee la adopción', async () => {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    expect((await adoptionOfAs(scene.chosen.client, scene.chosenId)).rows).toHaveLength(1)
    await declineAdoption(scene.chosen, scene.chosenId)

    expect((await contactAs(scene.chosen.client, scene.chosenId)).rows).toEqual([])
    expect((await contactAs(scene.publisher.client, scene.chosenId)).rows).toEqual([])
    expect((await adoptionOfAs(scene.chosen.client, scene.chosenId)).rows).toEqual([])
    const publisher = await adoptionOfAs(scene.publisher.client, scene.chosenId)
    expect(publisher.rows).toEqual([
      expect.objectContaining({ side: 'publisher', adopter_name: 'Ana' }),
    ])
    expect(publisher.rows[0]?.declined_at).not.toBeNull()
    for (const [who, client] of await outsiders(scene.other)) {
      // oxlint-disable-next-line no-await-in-loop
      const { rows } = await adoptionOfAs(client, scene.chosenId)
      expect({ who, rows }).toEqual({ who, rows: [] })
    }
  })
})

describeDb('el teléfono cuando la adopción termina o se corta (FR-031, FR-032)', () => {
  async function marked() {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    return scene
  }

  async function noPhoneEitherWay(scene: HandoverScene) {
    const adopter = await contactAs(scene.chosen.client, scene.chosenId)
    const publisher = await contactAs(scene.publisher.client, scene.chosenId)
    return { adopter: adopter.rows, publisher: publisher.rows }
  }

  // Covers: US4-AS2, FR-031
  it('volver a publicar: ninguna de las dos lo ve, y la adopción sigue a la vista de las dos', async () => {
    const scene = await marked()
    await changed(scene.publisher.id, scene.pet.petId, 'republish')
    expect(await noPhoneEitherWay(scene)).toEqual({ adopter: [], publisher: [] })
    const adopter = await adoptionOfAs(scene.chosen.client, scene.chosenId)
    expect(adopter.rows[0]?.ended_at).not.toBeNull()
    expect((await adoptionOfAs(scene.publisher.client, scene.chosenId)).rows).toHaveLength(1)
    expect((await myPetAdoptionsAs(scene.publisher.client)).rows).toEqual([])
  })

  // Covers: US4-AS4, US4-AS5, US4-AS6, FR-032, FR-033 (ni después de desbloquear o reactivar)
  it('bloqueo en cada dirección y suspensión de cada lado: no vuelve a verse al levantarlos', async () => {
    const scenes = await Promise.all(Array.from({ length: 4 }, () => marked()))
    const [byAdopter, byPublisher, adopterSuspended, publisherSuspended] = scenes
    if (!byAdopter || !byPublisher || !adopterSuspended || !publisherSuspended) {
      throw new Error('faltan escenas')
    }
    await block(byAdopter.chosen.id, byAdopter.publisher.id)
    await block(byPublisher.publisher.id, byPublisher.chosen.id)
    const suspensions = [
      await suspend(adopterSuspended.chosen.id),
      await suspend(publisherSuspended.publisher.id),
    ]
    for (const scene of scenes) {
      // oxlint-disable-next-line no-await-in-loop -- de a una adopción
      expect(await noPhoneEitherWay(scene)).toEqual({ adopter: [], publisher: [] })
    }

    await db()
      .from('blocks')
      .delete()
      .in('blocker_id', [byAdopter.chosen.id, byPublisher.publisher.id])
    await Promise.all(suspensions.map((id) => lift(id)))
    for (const scene of scenes) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await noPhoneEitherWay(scene)).toEqual({ adopter: [], publisher: [] })
      // oxlint-disable-next-line no-await-in-loop
      const both = await Promise.all([
        adoptionOfAs(scene.chosen.client, scene.chosenId),
        adoptionOfAs(scene.publisher.client, scene.chosenId),
      ])
      expect(both.map(({ rows }) => rows[0]?.contact_cut)).toEqual([true, true])
    }
  })
})
