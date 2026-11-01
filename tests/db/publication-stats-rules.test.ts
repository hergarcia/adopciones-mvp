// Qué suma y qué lee «Cómo le va a…» (historia #269): cada apertura y cada toque de quien no publicó,
// cada freno con su motivo, las solicitudes que el sitio guarda, desde cuándo, y que la fila se va
// con la publicación. Las sumas se llaman con el servicio, como el servidor.
import { afterEach, describe, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { insertApplication } from './applications-support'
import { deletePetAs, uruguayToday } from './deletion-reasons-support'
import { changed, setState } from './lifecycle-support'
import {
  countPetOpen,
  countTap,
  myPetStatsAs,
  petCounts,
  petStatsRow,
  statsPeople,
} from './publication-stats-support'
import { serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, ownerWithPet } = statsPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

const ZERO = { opens: 0, taps: 0, phone_stops: 0, identity_stops: 0 }

describeDb('las aperturas de la ficha de un animal', () => {
  describe('suman', () => {
    // Covers: US1-AS9, FR-001
    it('una por vez, con sesión o sin ella', async () => {
      const { pet } = await ownerWithPet()
      const diego = await person(1, 'Diego')
      expect(await countPetOpen(pet.code, null)).toBeNull()
      expect(await countPetOpen(pet.code, diego.id)).toBeNull()
      expect(await countPetOpen(pet.code, null)).toBeNull()
      expect(await petCounts(pet.petId)).toEqual({ ...ZERO, opens: 3 })
    })

    // Covers: FR-010, SC-001
    it('veinte a la vez suman veinte', async () => {
      const { pet } = await ownerWithPet()
      await Promise.all(Array.from({ length: 20 }, () => countPetOpen(pet.code, null)))
      expect((await petCounts(pet.petId))?.opens).toBe(20)
    })
  })

  // Covers: US1-AS7, FR-002
  it('la de quien publicó no suma', async () => {
    const { owner, pet } = await ownerWithPet()
    expect(await countPetOpen(pet.code, owner.id)).toBeNull()
    expect(await petCounts(pet.petId)).toEqual(ZERO)
  })

  it('un código que no existe no suma a nadie', async () => {
    const { pet } = await ownerWithPet()
    expect(await countPetOpen('zzzzzzzzzz', null)).toBeNull()
    expect(await petCounts(pet.petId)).toEqual(ZERO)
  })
})

describeDb('los toques de «Quiero adoptar» y sus frenos', () => {
  // Covers: US1-AS1, US1-AS2, US1-AS3, FR-004, FR-005
  it('el toque, cada freno con su motivo, y los dos juntos', async () => {
    const { pet } = await ownerWithPet({ requiredLevel: 2 })
    const bruno = await person(0, 'Bruno')
    expect(await countTap(pet.code, null, true)).toBeNull()
    expect(await petCounts(pet.petId)).toEqual({ ...ZERO, taps: 1 })
    expect(await countTap(pet.code, bruno.id, true, 'phone')).toBeNull()
    expect(await petCounts(pet.petId)).toEqual({ ...ZERO, taps: 2, phone_stops: 1 })
    expect(await countTap(pet.code, bruno.id, false, 'identity')).toBeNull()
    expect(await petCounts(pet.petId)).toEqual({
      ...ZERO,
      taps: 2,
      phone_stops: 1,
      identity_stops: 1,
    })
  })

  it('el de quien publicó no suma nada', async () => {
    const { owner, pet } = await ownerWithPet()
    expect(await countTap(pet.code, owner.id, true, 'phone')).toBeNull()
    expect(await petCounts(pet.petId)).toEqual(ZERO)
  })

  // Covers: FR-006
  it('un freno que no es de la verificación se rechaza y no suma ni el toque', async () => {
    const { pet } = await ownerWithPet()
    expect((await countTap(pet.code, null, true, 'limit'))?.code).toBe('22023')
    expect(await petCounts(pet.petId)).toEqual(ZERO)
  })
})

describeDb('lo que lee quien publicó', () => {
  // Covers: US1-AS1, US1-AS10, FR-007, FR-014
  it('sus números, el nivel que pide y las solicitudes mandadas, retiradas y cerradas', async () => {
    const { owner, pet } = await ownerWithPet({ requiredLevel: 2 })
    const [ana, diego, eva] = await Promise.all([
      person(1, 'Ana'),
      person(1, 'Diego'),
      person(1, 'Eva'),
    ])
    await insertApplication(ana, pet, owner, { status: 'withdrawn' })
    await insertApplication(diego, pet, owner, { status: 'closed', close_reason: 'not_receiving' })
    await insertApplication(eva, pet, owner)
    expect(await countPetOpen(pet.code, null)).toBeNull()
    expect(await countTap(pet.code, null, true)).toBeNull()

    const { rows, error } = await myPetStatsAs(owner.client, pet.petId)
    expect(error).toBeNull()
    expect(rows).toEqual([
      {
        opens: 1,
        taps: 1,
        phone_stops: 0,
        identity_stops: 0,
        applications: 3,
        counted_since: await uruguayToday(),
        from_publication: true,
        required_level: 2,
        code: pet.code,
        name: 'Tobi',
        sex: 'female',
      },
    ])
  })

  it('la solicitud de quien borró su cuenta deja de contarse', async () => {
    const { owner, pet } = await ownerWithPet()
    const ana = await person(1, 'Ana')
    await insertApplication(ana, pet, owner)
    expect((await myPetStatsAs(owner.client, pet.petId)).rows[0]?.applications).toBe(1)

    const { error } = await serviceClient().auth.admin.deleteUser(ana.id)
    expect(error).toBeNull()
    expect((await myPetStatsAs(owner.client, pet.petId)).rows[0]?.applications).toBe(0)
  })

  it('las solicitudes de otro animal no se cuentan', async () => {
    const { owner, pet } = await ownerWithPet()
    const { pet: other } = await ownerWithPet()
    await insertApplication(await person(1, 'Ana'), other, owner)
    expect((await myPetStatsAs(owner.client, pet.petId)).rows[0]?.applications).toBe(0)
  })
})

describeDb('desde cuándo, y hasta cuándo', () => {
  // Covers: US1-AS11, FR-011, FR-013
  it('nace con la publicación y renovar o volver a publicar no la mueven', async () => {
    const { owner, pet } = await ownerWithPet()
    const born = { counted_since: await uruguayToday(), from_publication: true }
    expect(await petStatsRow(pet.petId)).toEqual({ ...ZERO, ...born })
    expect(await countPetOpen(pet.code, null)).toBeNull()

    await setState(pet.petId, 'expired')
    await changed(owner.id, pet.petId, 'renew')
    await setState(pet.petId, 'adopted')
    await changed(owner.id, pet.petId, 'republish')
    expect(await petStatsRow(pet.petId)).toEqual({ ...ZERO, opens: 1, ...born })
  })

  // Covers: US1-AS17, FR-028, SC-006
  it('borrar el animal se lleva la fila', async () => {
    const { owner, pet } = await ownerWithPet()
    expect(await countPetOpen(pet.code, null)).toBeNull()
    expect((await deletePetAs(owner.id, pet.petId)).row?.outcome).toBe('done')
    expect(await petStatsRow(pet.petId)).toBeNull()
  })

  // Covers: US1-AS17, FR-028, SC-006
  it('borrar la cuenta de quien publicó se lleva la fila', async () => {
    const { owner, pet } = await ownerWithPet()
    expect(await countPetOpen(pet.code, null)).toBeNull()
    const { error } = await serviceClient().auth.admin.deleteUser(owner.id)
    expect(error).toBeNull()
    expect(await petStatsRow(pet.petId)).toBeNull()
  })
})
