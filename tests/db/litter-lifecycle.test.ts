// Los estados de cada cría (historia #206, research R4): marcar en proceso y disponible sin nivel 1
// y solo con la camada disponible, el fin de la adopción al volver a ofrecer una adoptada, y la
// camada adoptada cuando se entrega la última.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { markAccepted } from './application-responses-support'
import { adoptionsOf, markAdopted } from './adoptions-support'
import { applicationPeople } from './applications-support'
import {
  applyForYoung,
  changeYoung,
  expireLitter,
  litterWithYoung,
  pauseLitter,
  setYoungState,
  youngOf,
} from './litter-support'
import { setPhone } from './listing-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = applicationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function scene(count = 4) {
  const publisher = await person(1, 'Quien publica')
  const litter = await litterWithYoung(publisher.id, count)
  return { publisher, litter }
}

const statusOf = async (litterId: string, petId: string) =>
  (await youngOf(litterId)).find((one) => one.id === petId)?.status

async function litterStateAs(client: SyntheticUser['client'], code: string) {
  const { data, error } = await client.rpc('litter_by_code', { p_code: code })
  expect(error).toBeNull()
  return data?.[0]
}

describeDb('marcar una cría (US2)', () => {
  // Covers: US2-AS1, US2-AS2, FR-004
  it('en proceso y de vuelta disponible, sin nivel 1, sin tocar las otras crías', async () => {
    const { publisher, litter } = await scene()
    await setPhone(publisher.id, 'none')
    const [first, second] = litter.young

    const marked = await changeYoung(publisher.id, second.id, 'mark_in_process')
    expect(marked).toMatchObject({
      outcome: 'done',
      code: litter.code,
      litter_id: litter.litterId,
      name: 'Cría 2',
      litter_name: 'La camada de Luna',
      from_state: 'available',
      state: 'in_process',
      litter_state: 'available',
      ended_marked_at: null,
    })
    expect(await statusOf(litter.litterId, second.id)).toBe('in_process')
    expect(await statusOf(litter.litterId, first.id)).toBe('available')

    const back = await changeYoung(publisher.id, second.id, 'mark_available')
    expect(back).toMatchObject({ outcome: 'done', from_state: 'in_process', state: 'available' })
    expect(await statusOf(litter.litterId, second.id)).toBe('available')
  })

  // Covers: FR-009, SC-006, US2-AS13
  it('dos veces es «ya estaba», y lo que no corresponde dice cómo quedó sin cambiar nada', async () => {
    const { publisher, litter } = await scene()
    const [first, second] = litter.young

    await changeYoung(publisher.id, first.id, 'mark_in_process')
    expect(await changeYoung(publisher.id, first.id, 'mark_in_process')).toMatchObject({
      outcome: 'already',
      state: 'in_process',
    })
    expect(await changeYoung(publisher.id, second.id, 'mark_available')).toMatchObject({
      outcome: 'already',
      state: 'available',
    })

    await setYoungState(second.id, 'adopted')
    expect(await changeYoung(publisher.id, second.id, 'mark_in_process')).toMatchObject({
      outcome: 'changed',
      from_state: 'adopted',
      state: 'adopted',
    })
    expect(await statusOf(litter.litterId, second.id)).toBe('adopted')
  })

  // Covers: FR-008
  it('una cría de otra persona, un animal suelto o una que no existe es «no existe», sin cambios', async () => {
    const { publisher, litter } = await scene()
    const stranger = await person(1, 'Otra')
    const [first] = litter.young

    const outcomes = await Promise.all([
      changeYoung(stranger.id, first.id, 'mark_in_process'),
      changeYoung(publisher.id, crypto.randomUUID(), 'mark_in_process'),
    ])
    for (const row of outcomes) {
      expect(row).toEqual({
        outcome: 'not_found',
        code: null,
        litter_id: null,
        name: null,
        sex: null,
        litter_name: null,
        from_state: null,
        state: null,
        litter_state: null,
        published_at: null,
        ended_marked_at: null,
      })
    }
    expect(await statusOf(litter.litterId, first.id)).toBe('available')
  })

  // Covers: spec Edge Cases (acciones de una cría con la camada pausada o vencida)
  it('con la camada pausada o vencida no se marca en proceso ni disponible', async () => {
    const paused = await scene(2)
    await setYoungState(paused.litter.young[1].id, 'in_process')
    await pauseLitter(paused.litter.litterId)
    expect(
      await changeYoung(paused.publisher.id, paused.litter.young[0].id, 'mark_in_process'),
    ).toMatchObject({ outcome: 'changed', state: 'available', litter_state: 'paused' })
    expect(
      await changeYoung(paused.publisher.id, paused.litter.young[1].id, 'mark_available'),
    ).toMatchObject({ outcome: 'changed', state: 'in_process', litter_state: 'paused' })
    expect(await statusOf(paused.litter.litterId, paused.litter.young[1].id)).toBe('paused')

    const expired = await scene(2)
    await expireLitter(expired.litter.litterId)
    expect(
      await changeYoung(expired.publisher.id, expired.litter.young[0].id, 'mark_in_process'),
    ).toMatchObject({ outcome: 'changed', litter_state: 'expired' })
    expect(await statusOf(expired.litter.litterId, expired.litter.young[0].id)).toBe('available')
  })

  // Covers: US2-AS9, FR-007
  it('marcar disponible una adoptada a una persona termina su adopción y vuelve a vencer con la camada', async () => {
    const { publisher, litter } = await scene()
    const ana = await person(1, 'Ana')
    const young = litter.young[1]
    const applicationId = await applyForYoung(ana, young, publisher)
    await markAccepted(applicationId)
    expect((await markAdopted(publisher, young.id, applicationId)).outcome).toBe('done')

    const back = await changeYoung(publisher.id, young.id, 'mark_available')
    expect(back).toMatchObject({ outcome: 'done', from_state: 'adopted', state: 'available' })
    expect(back.ended_marked_at).not.toBeNull()

    const [adoption] = await adoptionsOf(young.id)
    expect(adoption?.ended_at).not.toBeNull()
    const [row] = (await youngOf(litter.litterId)).filter((one) => one.id === young.id)
    const [sibling] = await youngOf(litter.litterId)
    expect(row?.status).toBe('available')
    expect(row?.expires_at).toBe(sibling?.expires_at)
  })

  // Covers: US2-AS6, FR-030
  it('marcar adoptada a la última cría deja la camada adoptada, también si estaba pausada', async () => {
    const { publisher, litter } = await scene(2)
    const [first, second] = litter.young
    await setYoungState(first.id, 'adopted')
    expect((await litterStateAs(publisher.client, litter.code))?.state).toBe('available')

    await pauseLitter(litter.litterId)
    const marked = await markAdopted(publisher, second.id, null)
    expect(marked).toMatchObject({
      outcome: 'done',
      in_litter: true,
      litter_id: litter.litterId,
      litter_code: litter.code,
    })
    const row = (await youngOf(litter.litterId)).find((one) => one.id === second.id)
    expect(row).toMatchObject({ status: 'adopted', resume_status: null })
    expect((await litterStateAs(publisher.client, litter.code))?.state).toBe('adopted')
  })
})
