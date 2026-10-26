// La privacidad de la vida de una camada (historia #206, SC-003): quien fue aceptada para una cría lee
// solo el contacto de quien publicó, y nada de quienes pidieron otra cría por ningún camino; la
// bandeja de la camada es solo de su dueña; una camada pausada o vencida no se lee por ningún camino.
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
import { markAdopted } from './adoptions-support'
import { applicationsOf, submit } from './applications-support'
import {
  applyForYoung,
  expireLitter,
  litterWithYoung,
  pauseLitter,
  publishLitter,
  youngList,
  youngOf,
} from './litter-support'
import { BUCKET, stagedPhotos, uploadObjects } from './pet-support'
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

// Una camada con foto de la camada y foto propia de «Cría 1», con sus objetos subidos.
async function shownLitter() {
  const publisher = await person(1, 'Quien publica')
  const [cover, own] = await stagedPhotos(publisher.id, 2)
  const young = youngList(3, [{ photo_ids: [own] }])
  const { row, error } = await publishLitter(publisher.id, [cover], young)
  expect(error).toBeNull()
  await Promise.all([cover, own].map((id) => uploadObjects(publisher.id, id)))
  const litterId = row?.litter_id ?? ''
  return {
    publisher,
    litterId,
    code: row?.code ?? '',
    young: await youngOf(litterId),
    paths: [cover, own].map((id) => `${publisher.id}/${id}/card.webp`),
  }
}

async function readsAs(client: SyntheticUser['client'], scene: { code: string; paths: string[] }) {
  const [sheet, card, listed, ...photos] = await Promise.all([
    client.rpc('litter_by_code', { p_code: scene.code }),
    client.rpc('litter_share_card', { p_code: scene.code }),
    client.rpc('listed_pets', { p_limit: 241 }),
    ...scene.paths.map((path) => client.storage.from(BUCKET).download(path)),
  ])
  return {
    sheet: sheet.data ?? [],
    card: card.data ?? [],
    listed: (listed.data ?? []).some((one: { code: string }) => one.code === scene.code),
    photos: photos.map((photo) => photo.data !== null),
  }
}

describeDb('una camada pausada o vencida (US3)', () => {
  // Covers: US3-AS2, FR-015, FR-019, FR-021, SC-003
  it('nadie más que su dueña lee nada de ella: ni la ficha, ni la vista previa, ni el listado, ni las fotos', async () => {
    const paused = await shownLitter()
    const expired = await shownLitter()
    const stranger = await person(1, 'Cualquiera')
    expect((await readsAs(stranger.client, paused)).listed).toBe(true)
    expect((await readsAs(anonClient(), paused)).photos).toEqual([true, true])

    await pauseLitter(paused.litterId)
    // Adoptada mientras la camada está pausada: como animal está a la vista, pero su camada no.
    const [first] = paused.young
    expect((await markAdopted(paused.publisher, first?.id ?? '', null)).outcome).toBe('done')
    await expireLitter(expired.litterId)

    for (const [scene, visibility] of [
      [paused, 'paused'],
      [expired, 'expired'],
    ] as const) {
      for (const client of [anonClient(), stranger.client]) {
        // oxlint-disable-next-line no-await-in-loop -- dos roles, uno detrás del otro
        const reads = await readsAs(client, scene)
        expect(reads.sheet).toHaveLength(1)
        expect(reads.sheet[0]).toMatchObject({
          visibility,
          is_owner: false,
          code: null,
          name: null,
          photos: null,
          young: null,
          state: null,
        })
        expect(reads).toMatchObject({ card: [], listed: false, photos: [false, false] })
      }
      // oxlint-disable-next-line no-await-in-loop
      const own = await readsAs(scene.publisher.client, scene)
      expect(own.sheet[0]).toMatchObject({
        visibility,
        is_owner: true,
        state: visibility,
        name: 'La camada de Luna',
      })
      expect(own.photos).toEqual([true, true])
      expect(own.card).toEqual([])
    }
  })

  // Covers: FR-020 (la adoptada entera sigue a la vista)
  it('adoptada entera, la ficha y la vista previa se ven, fuera del listado', async () => {
    const scene = await shownLitter()
    for (const young of scene.young) {
      // oxlint-disable-next-line no-await-in-loop -- tres crías, una detrás de la otra
      await markAdopted(scene.publisher, young.id, null)
    }
    const reads = await readsAs(anonClient(), scene)
    expect(reads.sheet[0]).toMatchObject({ visibility: 'listed', state: 'adopted' })
    expect(reads.card[0]).toMatchObject({ adopted: true, name: 'La camada de Luna' })
    expect(reads).toMatchObject({ listed: false, photos: [true, true] })
  })

  // Covers: Edge Cases (una camada pausada o vencida no recibe solicitudes ni cierra las abiertas)
  it('una cría de una camada pausada o vencida no recibe solicitudes nuevas y las abiertas siguen', async () => {
    const paused = await shownLitter()
    const expired = await shownLitter()
    const [ana, bea] = await Promise.all([person(1, 'Ana'), person(1, 'Bea')])
    const open = await Promise.all(
      [paused, expired].map(async (scene) => {
        const young = scene.young[1]
        return applyForYoung(ana, { id: young?.id ?? '', name: young?.name ?? '' }, scene.publisher)
      }),
    )
    await pauseLitter(paused.litterId)
    await expireLitter(expired.litterId)

    for (const scene of [paused, expired]) {
      // oxlint-disable-next-line no-await-in-loop -- dos camadas, una detrás de la otra
      expect((await submit(bea, scene.young[1]?.code ?? '')).outcome).toBe('unavailable')
    }
    expect(await applicationsOf(bea.id)).toEqual([])
    const mine = await applicationsOf(ana.id)
    expect(mine.map((one) => one.id).toSorted()).toEqual(open.toSorted())
    for (const one of mine) expect(one.status).toBe('sent')
  })
})
