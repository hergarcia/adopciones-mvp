// Lo que leen las dos funciones de la medición (historia #236): el nivel de la chapita en el
// instante, no el de cuando se mandó (FR-016); si quien solicitó adoptó y respondió un seguimiento,
// solo sí o no (FR-017); y nada inventado cuando no hay a quién medir (FR-018).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { setPhone } from './listing-support'
import { applyForYoung, litterWithYoung } from './litter-support'
import { applyToPetOf, measureOf, measurePeople, publisherLevelOf } from './measured-levels-support'
import { suspend } from './moderation-support'
import type { SyntheticUser } from './roles'
import { give, verifyIdentity, withdraw } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, applyToRescuer, followedAdoption } = measurePeople(cleanups)

// De a una, como en las pruebas del seguimiento: las cascadas de la adopción cruzadas se trancan.
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) {
    // oxlint-disable-next-line no-await-in-loop
    await cleanup()
  }
})

describeDb('el nivel de ahora', () => {
  it('quien solicitó con nivel 1, 2 o 3, y quien publicó con el suyo', async () => {
    const [one, two, three] = await Promise.all([
      person(1, 'Diego'),
      person(2, 'Bruno'),
      person(3, 'Ana'),
    ])
    const ids = await Promise.all([one, two, three].map(async (p) => (await applyToRescuer(p)).id))
    const rows = await Promise.all(ids.map(measureOf))
    expect(rows).toEqual([
      [{ applicant_level: 1, applicant_follow_up: false, publisher_level: 1 }],
      [{ applicant_level: 2, applicant_follow_up: false, publisher_level: 1 }],
      [{ applicant_level: 3, applicant_follow_up: false, publisher_level: 1 }],
    ])
  })

  it('aprobarle la identidad después de mandar la solicitud da 2', async () => {
    const bruno = await person(1, 'Bruno')
    const { id } = await applyToRescuer(bruno)
    await verifyIdentity(bruno.id)
    expect((await measureOf(id))[0]?.applicant_level).toBe(2)
  })

  it('retirarle el aval a un nivel 3 da 2', async () => {
    const [ana, voucher] = await Promise.all([person(2, 'Ana'), person(2, 'Quien avala')])
    expect((await give(voucher, ana)).outcome).toBe('given')
    const { id } = await applyToRescuer(ana)
    expect((await measureOf(id))[0]?.applicant_level).toBe(3)
    await withdraw(voucher, ana)
    expect((await measureOf(id))[0]?.applicant_level).toBe(2)
  })

  it('perder el teléfono verificado da 0, no un nivel que falta', async () => {
    const bruno = await person(2, 'Bruno')
    const { id } = await applyToRescuer(bruno)
    await setPhone(bruno.id, 'lost')
    expect(await measureOf(id)).toEqual([
      { applicant_level: 0, applicant_follow_up: false, publisher_level: 1 },
    ])
  })

  it('la rescatista que subió de nivel se mide con el de ahora', async () => {
    const [carla, bruno] = await Promise.all([person(1, 'Carla'), person(1, 'Bruno')])
    const { id } = await applyToPetOf(bruno, carla)
    await verifyIdentity(carla.id)
    expect((await measureOf(id))[0]?.publisher_level).toBe(2)
  })
})

describeDb('la adopción con seguimiento', () => {
  it('sí, con una adopción como adoptante y el seguimiento respondido', async () => {
    const { adopter } = await followedAdoption()
    const { id } = await applyToRescuer(adopter)
    expect((await measureOf(id))[0]?.applicant_follow_up).toBe(true)
  })

  it('no, con el seguimiento todavía pendiente', async () => {
    const { adopter } = await followedAdoption(false)
    const { id } = await applyToRescuer(adopter)
    expect((await measureOf(id))[0]?.applicant_follow_up).toBe(false)
  })

  it('no, para quien solo dio un animal con el seguimiento respondido', async () => {
    const { giver } = await followedAdoption()
    const { id } = await applyToRescuer(giver)
    expect((await measureOf(id))[0]?.applicant_follow_up).toBe(false)
  })

  it('no, para una cuenta suspendida, que no muestra adopciones', async () => {
    const { adopter } = await followedAdoption()
    const { id } = await applyToRescuer(adopter)
    await suspend(adopter.id)
    expect((await measureOf(id))[0]?.applicant_follow_up).toBe(false)
  })
})

describeDb('cuando no hay a quién medir', () => {
  it('sin la solicitud, o con quien solicitó borrada, ninguna fila', async () => {
    expect(await measureOf(crypto.randomUUID())).toEqual([])
    const bruno = await person(2, 'Bruno')
    const { id } = await applyToRescuer(bruno)
    await bruno.cleanup()
    expect(await measureOf(id)).toEqual([])
  })

  it('quien publicó y borró su cuenta queda sin nivel, nunca con 0', async () => {
    const [carla, bruno] = await Promise.all([person(2, 'Carla'), person(2, 'Bruno')])
    const { id } = await applyToPetOf(bruno, carla)
    await carla.cleanup()
    expect(await measureOf(id)).toEqual([
      { applicant_level: 2, applicant_follow_up: false, publisher_level: null },
    ])
  })
})

describeDb('el nivel de quien publicó, por código', () => {
  it('el de la dueña del animal, el de ahora; un código que no existe, nulo', async () => {
    const carla = await person(1, 'Carla')
    const { pet } = await applyToPetOf(await person(1, 'Bruno'), carla)
    expect(await publisherLevelOf(pet.code)).toBe(1)
    await verifyIdentity(carla.id)
    expect(await publisherLevelOf(pet.code)).toBe(2)
    expect(await publisherLevelOf('no-existe')).toBeNull()
  })

  it('una cría: el nivel de quien publicó la camada, en la solicitud y por su código', async () => {
    const [carla, bruno] = await Promise.all([person(2, 'Carla'), person(1, 'Bruno')])
    const litter = await litterWithYoung(carla.id, 2)
    const young = litter.young[0]
    if (young === undefined) throw new Error('la camada no tiene crías')
    const id = await applyForYoung(bruno, young, carla)
    expect(await measureOf(id)).toEqual([
      { applicant_level: 1, applicant_follow_up: false, publisher_level: 2 },
    ])
    expect(await publisherLevelOf(young.code)).toBe(2)
  })
})
