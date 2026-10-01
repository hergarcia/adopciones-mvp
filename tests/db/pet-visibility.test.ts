// Lo que NO debe verse de una publicación según su estado (historia #59, constitución §V): pausada,
// vencida y dada de baja no dejan leer nada por ningún camino —el listado, la ficha, la vista previa,
// las fotos, la foto de quien publica— ni sin sesión ni con otra cuenta. Adoptada se ve como ficha,
// fuera del listado. Cada regla se demuestra con un intento que tiene que fallar.
import { afterEach, expect, it } from 'vitest'
import type { PetState } from '../../src/lib/pets/types'
import { describeDb } from '../setup/env-report'
import { setState } from './lifecycle-support'
import {
  countedInWindow,
  futureWindow,
  listPet,
  listedAfter,
  publishers,
  type PhoneState,
} from './listing-support'
import { anonClient, asNewUser, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function visitors() {
  const stranger = await asNewUser()
  cleanups.push(stranger.cleanup)
  return [
    { who: 'sin sesión', client: anonClient() },
    { who: 'otra cuenta', client: stranger.client },
  ]
}

type Client = SyntheticUser['client']

async function byCode(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_by_code', { p_code: code })
  expect(error).toBeNull()
  const rows: Record<string, unknown>[] = data ?? []
  return rows
}

async function shareCard(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_share_card', { p_code: code })
  expect(error).toBeNull()
  const rows: Record<string, unknown>[] = data ?? []
  return rows
}

async function petIn(state: PetState, phone: PhoneState = 'level_one') {
  const window = futureWindow()
  const owner = await publisher({ phone, avatar: true })
  const pet = await listPet(owner.id, { publishedAt: window.at(1), upload: true, photos: 2 })
  await setState(pet.petId, state)
  return { owner, window, ...pet }
}

const photoPath = (pet: { owner: { id: string }; photoIds: string[] }) =>
  `${pet.owner.id}/${pet.photoIds[1]}/card.webp`

// Lo que devuelve la ficha cuando solo dice por qué no se ve: todo lo demás, nulo.
function whatItSays(rows: Record<string, unknown>[]) {
  const [row] = rows
  const { visibility, is_owner: isOwner, ...rest } = row ?? {}
  const anythingElse = Object.entries(rest).filter(([, value]) => value !== null)
  return { rows: rows.length, visibility, isOwner, anythingElse }
}

const only = (visibility: string) => ({ rows: 1, visibility, isOwner: false, anythingElse: [] })

describeDb('el listado', () => {
  // Covers: FR-008, US1-AS1, US1-AS3, US1-AS4, SC-006
  it('muestra disponibles y en proceso, con su estado; nada más, ni en el total', async () => {
    const window = futureWindow()
    const owner = await publisher()
    const pets = await Promise.all(
      (['available', 'in_process', 'paused', 'adopted', 'expired', 'taken_down'] as const).map(
        async (state, index) => {
          const pet = await listPet(owner.id, { publishedAt: window.at(index + 1) })
          await setState(pet.petId, state)
          return { state, code: pet.code }
        },
      ),
    )
    const codeOf = (state: PetState) => pets.find((pet) => pet.state === state)?.code

    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      const rows = (await listedAfter(client, window)) as { code: string; status: string }[]
      const ours = rows.filter((row) => pets.some((pet) => pet.code === row.code))
      expect(ours).toEqual([
        expect.objectContaining({ code: codeOf('in_process'), status: 'in_process' }),
        expect.objectContaining({ code: codeOf('available'), status: 'available' }),
      ])
      // oxlint-disable-next-line no-await-in-loop
      expect(await countedInWindow(client, window)).toBe(2)
    }
  })
})

describeDb('la ficha según el estado', () => {
  // Covers: FR-009, FR-012, US1-AS4, US2-AS3, SC-006
  it.each(['paused', 'expired'] as const)('%s: solo dice eso, sin ningún dato', async (state) => {
    const { code } = await petIn(state)
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      expect(whatItSays(await byCode(client, code))).toEqual(only(state))
    }
  })

  // Covers: FR-009, FR-012, SC-005, SC-006
  it('dada de baja: sin fila, como una que no existe', async () => {
    const { code } = await petIn('taken_down')
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await byCode(client, code)).toEqual([])
    }
  })

  // Covers: FR-009 (precedencia de Edge Cases: lo que eligió el publicador antes que su teléfono)
  it.each([
    { state: 'paused', says: 'paused' },
    { state: 'expired', says: 'expired' },
    { state: 'adopted', says: 'hidden' },
    { state: 'in_process', says: 'hidden' },
  ] as const)('$state con el publicador sin nivel 1 dice $says', async ({ state, says }) => {
    const { code } = await petIn(state, 'change_pending')
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      expect(whatItSays(await byCode(client, code))).toEqual(only(says))
    }
  })

  // Covers: FR-010, US1-AS1, US1-AS3
  it.each([
    { state: 'adopted', visibility: 'adopted' },
    { state: 'in_process', visibility: 'listed' },
  ] as const)('$state: la ficha entera, con su estado y sin el motivo', async (c) => {
    const { code } = await petIn(c.state)
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      const [row] = await byCode(client, code)
      expect(row).toMatchObject({
        visibility: c.visibility,
        state: c.state,
        is_owner: false,
        pet_id: null,
        name: 'Luna',
        publisher_level: 1,
        takedown_reason: null,
        takedown_note: null,
      })
    }
  })

  // Covers: FR-013, FR-029, US1-AS12
  it.each(['paused', 'expired', 'taken_down'] as const)(
    '%s: su publicador la ve entera, con el estado',
    async (state) => {
      const { owner, code, petId } = await petIn(state)
      const [row] = await byCode(owner.client, code)
      expect(row).toMatchObject({ is_owner: true, state, pet_id: petId, name: 'Luna' })
      expect(row.photos).toHaveLength(2)
      expect(row.publisher_level).toBeNull()
    },
  )

  // Covers: FR-029 (el motivo para su publicador, nunca quién decidió)
  it('dada de baja: su publicador lee el motivo', async () => {
    const { owner, code } = await petIn('taken_down')
    const [row] = await byCode(owner.client, code)
    expect(row).toMatchObject({
      visibility: 'hidden',
      takedown_reason: 'other',
      takedown_note: 'Tenía un teléfono escrito en la foto.',
    })
    expect(Object.keys(row)).not.toContain('resolved_by')
  })
})

describeDb('la vista previa según el estado', () => {
  // Covers: FR-011, FR-012, US1-AS9, SC-005
  it('solo a la vista o adoptada; la adoptada dice que lo está', async () => {
    const cases = await Promise.all(
      (['available', 'in_process', 'adopted', 'paused', 'expired', 'taken_down'] as const).map(
        async (state) => ({ state, ...(await petIn(state)) }),
      ),
    )
    for (const { client } of await visitors()) {
      for (const pet of cases) {
        // oxlint-disable-next-line no-await-in-loop
        const rows = await shareCard(client, pet.code)
        const shown = ['available', 'in_process', 'adopted'].includes(pet.state)
        expect({ state: pet.state, names: rows.map((row) => row.name) }).toEqual({
          state: pet.state,
          names: shown ? ['Luna'] : [],
        })
      }
    }
    const adopted = cases.find((pet) => pet.state === 'adopted')
    const [card] = await shareCard(anonClient(), String(adopted?.code))
    expect(card.status).toBe('adopted')
  })

  // Covers: FR-011 (la imagen de una adoptada cambia, así que su dirección también)
  it('la versión cambia al adoptarse, y no al pasar a en proceso', async () => {
    const pet = await petIn('available')
    const versions = async () => {
      const [card] = await shareCard(anonClient(), pet.code)
      const [row] = await byCode(anonClient(), pet.code)
      expect(row.version).toBe(card.version)
      return card.version
    }
    const available = await versions()

    await setState(pet.petId, 'in_process')
    expect(await versions()).toBe(available)

    await setState(pet.petId, 'adopted')
    expect(await versions()).not.toBe(available)
  })
})

describeDb('las fotos según el estado', () => {
  // Covers: FR-012, SC-006
  it.each(['paused', 'expired', 'taken_down'] as const)(
    '%s: ni sus fotos ni la foto de quien publica se firman',
    async (state) => {
      const pet = await petIn(state)
      for (const { client } of await visitors()) {
        // oxlint-disable-next-line no-await-in-loop
        const photo = await client.storage.from('pet-photos').createSignedUrl(photoPath(pet), 60)
        expect(photo.data).toBeNull()
        // oxlint-disable-next-line no-await-in-loop
        const avatar = await client.storage
          .from('avatars')
          .createSignedUrl(`${pet.owner.id}/avatar.webp`, 60)
        expect(avatar.data).toBeNull()
      }
    },
  )

  // Covers: FR-012 (las de una adoptada a la vista se leen como las de una disponible)
  it.each(['adopted', 'in_process'] as const)(
    '%s: sus fotos y su publicador se firman',
    async (s) => {
      const pet = await petIn(s)
      for (const { client } of await visitors()) {
        // oxlint-disable-next-line no-await-in-loop
        const photo = await client.storage.from('pet-photos').createSignedUrl(photoPath(pet), 60)
        expect(photo.error).toBeNull()
        // oxlint-disable-next-line no-await-in-loop
        const avatar = await client.storage
          .from('avatars')
          .createSignedUrl(`${pet.owner.id}/avatar.webp`, 60)
        expect(avatar.error).toBeNull()
      }
    },
  )

  // Covers: FR-012 (otra cuenta no lee la fila por la tabla, en ningún estado)
  it('la tabla de una publicación ajena no devuelve nada', async () => {
    const pet = await petIn('taken_down')
    for (const { client } of await visitors()) {
      // oxlint-disable-next-line no-await-in-loop
      const { data } = await client.from('pets').select('takedown_reason').eq('id', pet.petId)
      expect(data ?? []).toEqual([])
    }
  })
})
