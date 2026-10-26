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
  changeLitter,
  changeYoung,
  expireLitter,
  litterRow,
  litterWithYoung,
  pauseLitter,
  publishLitter,
  removeYoung,
  saveLitter,
  savedYoungOf,
  setYoungState,
  youngList,
  youngOf,
} from './litter-support'
import { LIFETIME_MS, msFrom } from './lifecycle-support'
import { setPhone } from './listing-support'
import { db, firstRow } from './phone-support'
import { stagedPhotos } from './pet-support'
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

const byId = async (litterId: string) =>
  new Map((await youngOf(litterId)).map((one) => [one.id, one]))

const NOT_FOUND = {
  outcome: 'not_found',
  code: null,
  name: null,
  from_state: null,
  state: null,
  expires_at: null,
  published_at: null,
  ended_count: 0,
  ended_marked_at: [],
}

describeDb('la camada entera (US3)', () => {
  // Covers: US3-AS1, US3-AS7, US3-AS10, FR-004, FR-005
  it('pausar sin nivel 1 guarda a dónde vuelve cada cría; reanudar pide nivel 1 y las devuelve', async () => {
    const { publisher, litter } = await scene()
    const [first, , third, fourth] = litter.young
    await setYoungState(third.id, 'in_process')
    await setPhone(publisher.id, 'none')

    const paused = await changeLitter(publisher.id, litter.litterId, 'pause')
    expect(paused).toMatchObject({
      outcome: 'done',
      code: litter.code,
      name: 'La camada de Luna',
      from_state: 'available',
      state: 'paused',
    })
    const pausedYoung = await byId(litter.litterId)
    expect(pausedYoung.get(first.id)).toMatchObject({
      status: 'paused',
      resume_status: 'available',
      expires_at: null,
    })
    expect(pausedYoung.get(third.id)).toMatchObject({
      status: 'paused',
      resume_status: 'in_process',
    })
    expect(await changeLitter(publisher.id, litter.litterId, 'pause')).toMatchObject({
      outcome: 'already',
      state: 'paused',
    })

    // Adoptada mientras la camada estaba pausada: sigue adoptada al reanudar (US3-10).
    expect((await markAdopted(publisher, fourth.id, null)).outcome).toBe('done')

    expect(await changeLitter(publisher.id, litter.litterId, 'resume')).toMatchObject({
      outcome: 'needs_verification',
      state: 'paused',
    })
    expect((await byId(litter.litterId)).get(first.id)?.status).toBe('paused')

    await setPhone(publisher.id, 'level_one')
    const resumed = await changeLitter(publisher.id, litter.litterId, 'resume')
    expect(resumed).toMatchObject({ outcome: 'done', from_state: 'paused', state: 'available' })
    expect(msFrom(resumed.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)

    const back = await byId(litter.litterId)
    expect(back.get(first.id)).toMatchObject({
      status: 'available',
      resume_status: null,
      expires_at: resumed.expires_at,
    })
    expect(back.get(third.id)).toMatchObject({
      status: 'in_process',
      expires_at: resumed.expires_at,
    })
    expect(back.get(fourth.id)).toMatchObject({ status: 'adopted', expires_at: null })
    expect((await litterRow(litter.litterId))?.paused_at).toBeNull()
  })

  // Covers: US3-AS6, FR-010, FR-014
  it('renovar deja 30 días desde ahora sin sumar; editar o cambiar una cría no corre el vencimiento', async () => {
    const { publisher, litter } = await scene(2)
    const old = new Date(Date.now() + 3 * 86_400_000).toISOString()
    await db()
      .from('litters')
      .update({ expires_at: old, reminder_sent_at: new Date().toISOString() })
      .eq('id', litter.litterId)

    await changeYoung(publisher.id, litter.young[0].id, 'mark_in_process')
    const saved = await saveLitter(
      publisher.id,
      litter.litterId,
      litter.photoIds,
      await savedYoungOf(litter.litterId),
    )
    expect(saved.error).toBeNull()
    expect(msFrom((await litterRow(litter.litterId))?.expires_at, Date.parse(old))).toBeLessThan(1)

    const first = await changeLitter(publisher.id, litter.litterId, 'renew')
    const second = await changeLitter(publisher.id, litter.litterId, 'renew')
    expect(first).toMatchObject({ outcome: 'done', from_state: 'available', state: 'available' })
    expect(msFrom(second.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)
    const row = await litterRow(litter.litterId)
    expect(row?.reminder_sent_at).toBeNull()
    expect(row?.published_at).toBe(second.published_at)
    const young = await byId(litter.litterId)
    expect(young.get(litter.young[0].id)).toMatchObject({
      status: 'in_process',
      expires_at: second.expires_at,
    })
  })

  // Covers: US3-AS4, FR-006
  it('volver a publicar una vencida la sube con 30 días y cada cría como estaba', async () => {
    const { publisher, litter } = await scene(3)
    await setYoungState(litter.young[1].id, 'in_process')
    await setYoungState(litter.young[2].id, 'adopted')
    await expireLitter(litter.litterId)
    const before = await litterRow(litter.litterId)

    expect(await changeLitter(publisher.id, litter.litterId, 'renew')).toMatchObject({
      outcome: 'changed',
      state: 'expired',
    })
    expect(
      await changeLitter(publisher.id, litter.litterId, 'republish', [litter.young[2].id]),
    ).toMatchObject({ outcome: 'changed', state: 'expired' })

    const done = await changeLitter(publisher.id, litter.litterId, 'republish')
    expect(done).toMatchObject({
      outcome: 'done',
      from_state: 'expired',
      state: 'available',
      ended_count: 0,
      ended_marked_at: [],
    })
    expect(Date.parse(done.published_at)).toBeGreaterThan(Date.parse(String(before?.published_at)))
    const young = await byId(litter.litterId)
    expect(young.get(litter.young[0].id)).toMatchObject({
      status: 'available',
      expires_at: done.expires_at,
    })
    expect(young.get(litter.young[1].id)?.status).toBe('in_process')
    expect(young.get(litter.young[2].id)?.status).toBe('adopted')
  })

  // Covers: US3-AS5, FR-006
  it('volver a publicar una adoptada deja disponibles solo las elegidas y termina sus adopciones', async () => {
    const { publisher, litter } = await scene(2)
    const ana = await person(1, 'Ana')
    const [first, second] = litter.young
    const applicationId = await applyForYoung(ana, first, publisher)
    await markAccepted(applicationId)
    expect((await markAdopted(publisher, first.id, applicationId)).outcome).toBe('done')
    expect((await markAdopted(publisher, second.id, null)).outcome).toBe('done')
    const other = await scene(2)

    expect(await changeLitter(publisher.id, litter.litterId, 'republish')).toMatchObject({
      outcome: 'changed',
      state: 'adopted',
    })
    expect(
      await changeLitter(publisher.id, litter.litterId, 'republish', [other.litter.young[0].id]),
    ).toMatchObject({ outcome: 'changed', state: 'adopted' })

    await setPhone(publisher.id, 'none')
    expect(
      await changeLitter(publisher.id, litter.litterId, 'republish', [first.id]),
    ).toMatchObject({ outcome: 'needs_verification', state: 'adopted' })
    expect((await byId(litter.litterId)).get(first.id)?.status).toBe('adopted')

    await setPhone(publisher.id, 'level_one')
    const done = await changeLitter(publisher.id, litter.litterId, 'republish', [
      first.id,
      first.id,
    ])
    expect(done).toMatchObject({
      outcome: 'done',
      from_state: 'adopted',
      state: 'available',
      ended_count: 1,
    })
    expect(done.ended_marked_at).toHaveLength(1)
    const young = await byId(litter.litterId)
    expect(young.get(first.id)).toMatchObject({ status: 'available', expires_at: done.expires_at })
    expect(young.get(second.id)?.status).toBe('adopted')
    const [adoption] = await adoptionsOf(first.id)
    expect(adoption?.ended_at).not.toBeNull()
    const [kept] = await adoptionsOf(second.id)
    expect(kept?.ended_at).toBeNull()
  })

  // Covers: FR-004 (renovar pide nivel 1; pausar no)
  it('sin nivel 1 renovar no cambia nada', async () => {
    const { publisher, litter } = await scene(2)
    await setPhone(publisher.id, 'none')
    const before = await litterRow(litter.litterId)
    expect(await changeLitter(publisher.id, litter.litterId, 'renew')).toMatchObject({
      outcome: 'needs_verification',
      state: 'available',
    })
    expect((await litterRow(litter.litterId))?.expires_at).toBe(before?.expires_at)
  })

  // Covers: FR-008, FR-003
  it('una camada de otra persona o que no existe es «no existe»; dada de baja no cambia', async () => {
    const { publisher, litter } = await scene(2)
    const stranger = await person(1, 'Otra')
    expect(await changeLitter(stranger.id, litter.litterId, 'pause')).toEqual(NOT_FOUND)
    expect(await changeLitter(publisher.id, crypto.randomUUID(), 'renew')).toEqual(NOT_FOUND)
    expect((await litterRow(litter.litterId))?.paused_at).toBeNull()

    const { error } = await db()
      .from('litters')
      .update({ taken_down_at: new Date().toISOString(), takedown_reason: 'sale_or_money' })
      .eq('id', litter.litterId)
    expect(error).toBeNull()
    expect(await changeLitter(publisher.id, litter.litterId, 'pause')).toMatchObject({
      outcome: 'taken_down',
      from_state: 'taken_down',
      state: 'taken_down',
    })
    expect((await litterRow(litter.litterId))?.paused_at).toBeNull()
  })
})

async function photoRows(ids: string[]) {
  const { data } = await db()
    .from('pet_photos')
    .select('id, pet_id, litter_id, released_at')
    .in('id', ids)
  return data ?? []
}

describeDb('quitar una cría (US4)', () => {
  // Covers: US4-AS2, FR-033
  it('sin nivel 1 quita la cría y suelta sus fotos; la camada sigue con las demás', async () => {
    const publisher = await person(1, 'Quien publica')
    const [cover, own] = await stagedPhotos(publisher.id, 2)
    const { row, error } = await publishLitter(
      publisher.id,
      [cover],
      youngList(3, [{}, { photo_ids: [own] }]),
    )
    expect(error).toBeNull()
    const litter = firstRow(row ? [row] : [], 'publish_litter')
    const [first, second, third] = await youngOf(litter.litter_id)
    await setPhone(publisher.id, 'none')

    expect(await removeYoung(publisher.id, second.id)).toEqual({
      outcome: 'young_deleted',
      litter_id: litter.litter_id,
      litter_code: litter.code,
      from_state: 'available',
      released: [own],
    })
    expect((await youngOf(litter.litter_id)).map((one) => one.id)).toEqual([first.id, third.id])
    expect(await photoRows([own, cover])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: own, pet_id: null, litter_id: null }),
        expect.objectContaining({ id: cover, litter_id: litter.litter_id, released_at: null }),
      ]),
    )
    const [released] = await photoRows([own])
    expect(released?.released_at).not.toBeNull()
    expect(await litterRow(litter.litter_id)).not.toBeNull()
  })

  // Covers: US4-AS3, FR-035
  it('quitar la única cría borra la camada con sus fotos', async () => {
    const publisher = await person(1, 'Quien publica')
    const litter = await litterWithYoung(publisher.id, 2)
    const [gone, only] = litter.young
    expect((await removeYoung(publisher.id, gone.id)).outcome).toBe('young_deleted')
    await setYoungState(only.id, 'in_process')

    expect(await removeYoung(publisher.id, only.id)).toEqual({
      outcome: 'litter_deleted',
      litter_id: litter.litterId,
      litter_code: litter.code,
      from_state: 'in_process',
      released: litter.photoIds,
    })
    const { data } = await db().from('litters').select('id').eq('id', litter.litterId)
    expect(data).toEqual([])
    expect(await youngOf(litter.litterId)).toEqual([])
  })

  // Covers: US4-AS4, FR-030
  it('quitar la única disponible con las demás adoptadas deja la camada adoptada', async () => {
    const { publisher, litter } = await scene(3)
    const [first, second, third] = litter.young
    await setYoungState(first.id, 'adopted')
    await setYoungState(second.id, 'adopted')

    expect(await removeYoung(publisher.id, third.id)).toMatchObject({
      outcome: 'young_deleted',
      from_state: 'available',
    })
    expect((await litterStateAs(publisher.client, litter.code))?.state).toBe('adopted')
  })

  // Covers: spec Edge Cases (quitar vale con la camada pausada, vencida o adoptada; una adoptada se
  // quita con su adopción)
  it('con la camada pausada se quita, también una adoptada, con su adopción', async () => {
    const { publisher, litter } = await scene(3)
    const ana = await person(1, 'Ana')
    const [first, second] = litter.young
    const applicationId = await applyForYoung(ana, first, publisher)
    await markAccepted(applicationId)
    expect((await markAdopted(publisher, first.id, applicationId)).outcome).toBe('done')
    await pauseLitter(litter.litterId)

    expect(await removeYoung(publisher.id, first.id)).toMatchObject({
      outcome: 'young_deleted',
      from_state: 'adopted',
    })
    expect(await adoptionsOf(first.id)).toEqual([])
    expect(await removeYoung(publisher.id, second.id)).toMatchObject({
      outcome: 'young_deleted',
      from_state: 'available',
    })
    expect(await youngOf(litter.litterId)).toHaveLength(1)
  })

  // Covers: FR-008, spec Edge Cases (con la camada dada de baja, solo se borra la camada)
  it('una cría de otra persona o que no existe es «no existe»; con la camada dada de baja no se quita', async () => {
    const { publisher, litter } = await scene(2)
    const stranger = await person(1, 'Otra')
    const [first] = litter.young
    const gone = {
      outcome: 'not_found',
      litter_id: null,
      litter_code: null,
      from_state: null,
      released: [],
    }
    expect(await removeYoung(stranger.id, first.id)).toEqual(gone)
    expect(await removeYoung(publisher.id, crypto.randomUUID())).toEqual(gone)

    const { error } = await db()
      .from('litters')
      .update({ taken_down_at: new Date().toISOString(), takedown_reason: 'sale_or_money' })
      .eq('id', litter.litterId)
    expect(error).toBeNull()
    expect(await removeYoung(publisher.id, first.id)).toEqual({
      outcome: 'taken_down',
      litter_id: litter.litterId,
      litter_code: litter.code,
      from_state: 'available',
      released: [],
    })
    expect(await youngOf(litter.litterId)).toHaveLength(2)
  })
})
