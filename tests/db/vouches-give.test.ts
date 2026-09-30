// Dar y retirar un aval, sin pasar por la pantalla (FR-011, FR-013, FR-014, SC-004). Cada regla se
// demuestra con un intento que no da el aval; la carrera, con dos pedidos en paralelo.
import { afterEach, describe, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'
import {
  TTL,
  countVouches,
  give,
  myVouches,
  pauseLevel,
  people,
  standing,
  withdraw,
  type Person,
} from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const person = people(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function giveTo(voucher: Person, publicId: string) {
  const { data, error } = await db().rpc('give_vouch', {
    p_voucher: voucher.id,
    p_vouchee_public_id: publicId,
    p_pending_ttl: TTL,
  })
  expect(error).toBeNull()
  return data?.[0]
}

describeDb('dar un aval', () => {
  // Covers: US3-AS1, FR-012
  it('con las dos en nivel 2 se da, y quien lo recibe pasa a nivel 3', async () => {
    const ana = await person()
    const beto = await person()

    expect(await give(ana, beto)).toEqual({
      outcome: 'given',
      created: true,
      reached_level_three: true,
    })
    expect(await countVouches('vouches', ana.id, beto.id)).toBe(1)
  })

  // Covers: US3-AS12, FR-014. El doble toque y el reintento no dan dos avales ni cuentan dos veces.
  it('es idempotente: la segunda vez dice que ya está, sin crearlo de nuevo', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)

    expect(await give(ana, beto)).toEqual({
      outcome: 'given',
      created: false,
      reached_level_three: false,
    })
    expect(await countVouches('vouches', ana.id, beto.id)).toBe(1)
  })

  // Covers: FR-013. Cada regla, con un intento fallido.
  describe('no se da', () => {
    it('a un perfil que no existe', async () => {
      const ana = await person()
      expect((await giveTo(ana, 'AAAAAAAAAAAAAAAAAAAAAA'))?.outcome).toBe('not_found')
    })

    it('a una misma', async () => {
      const ana = await person()
      expect((await give(ana, ana)).outcome).toBe('self')
      expect(await countVouches('vouches', ana.id, ana.id)).toBe(0)
    })

    // Covers: US3-AS8
    it('a quien te avala', async () => {
      const ana = await person()
      const beto = await person()
      await give(beto, ana)

      expect(await give(ana, beto)).toEqual({
        outcome: 'reciprocal',
        created: false,
        reached_level_three: false,
      })
      expect(await countVouches('vouches', ana.id, beto.id)).toBe(0)
    })

    it('a quien te avala aunque su aval esté en pausa', async () => {
      const ana = await person()
      const beto = await person()
      await give(beto, ana)
      await pauseLevel(beto.id)

      expect((await give(ana, beto)).outcome).toBe('reciprocal')
    })

    // Covers: US4-AS2
    it('a quien te quitó un aval', async () => {
      const ana = await person()
      const beto = await person()
      await db().from('vouch_blocks').insert({ voucher_id: ana.id, vouchee_id: beto.id })

      expect((await give(ana, beto)).outcome).toBe('blocked')
      expect(await countVouches('vouches', ana.id, beto.id)).toBe(0)
    })

    // Covers: US3-AS6
    it('a quien no tiene nivel 2', async () => {
      const ana = await person()
      const beto = await person(1)
      expect((await give(ana, beto)).outcome).toBe('vouchee_level')
    })

    // Covers: US3-AS5
    it('si quien avala no tiene nivel 2', async () => {
      const ana = await person(1)
      const beto = await person()
      expect((await give(ana, beto)).outcome).toBe('voucher_level')
      expect(await countVouches('vouches', ana.id, beto.id)).toBe(0)
    })
  })

  // El orden de FR-011: el motivo que vuelve dice lo mismo que habría dicho la pantalla.
  it('con dos motivos a la vez gana el primero: quien te avala antes que una quita', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)
    await db().from('vouches').delete().eq('voucher_id', ana.id).eq('vouchee_id', beto.id)
    await db().from('vouch_blocks').insert({ voucher_id: ana.id, vouchee_id: beto.id })
    await give(beto, ana)

    expect((await give(ana, beto)).outcome).toBe('reciprocal')
  })

  it('las dos sin nivel 2: el motivo es de quien recibe, antes que de quien da', async () => {
    const ana = await person(1)
    const beto = await person(1)
    expect((await give(ana, beto)).outcome).toBe('vouchee_level')
  })

  // Covers: US3-AS4, FR-028. «Llegó a nivel 3» es el paso de 2 a 3, no cada aval.
  it('el paso a nivel 3 se marca solo cuando ningún aval contaba', async () => {
    const ana = await person()
    const beto = await person()
    const carla = await person()
    const dani = await person()
    await give(ana, carla)
    await pauseLevel(ana.id)

    expect((await give(beto, carla)).reached_level_three).toBe(true)
    expect((await give(dani, carla)).reached_level_three).toBe(false)
  })

  it('dos personas que avalan a la misma a la vez marcan el paso una sola vez', async () => {
    const ana = await person()
    const beto = await person()
    const carla = await person()

    const results = await Promise.all([give(ana, carla), give(beto, carla)])
    expect(results.map((result) => result.outcome)).toEqual(['given', 'given'])
    expect(results.filter((result) => result.reached_level_three)).toHaveLength(1)
  })

  // Covers: SC-004. El cruce simultáneo deja a lo sumo un aval.
  it('dos personas que se avalan entre ellas a la vez dejan un solo aval', async () => {
    const ana = await person()
    const beto = await person()

    const results = await Promise.all([give(ana, beto), give(beto, ana)])
    expect(results.map((result) => result.outcome).sort()).toEqual(['given', 'reciprocal'])
    const total =
      (await countVouches('vouches', ana.id, beto.id)) +
      (await countVouches('vouches', beto.id, ana.id))
    expect(total).toBe(1)
  })
})

describeDb('la relación entre quien mira y la persona mirada', () => {
  it('cada bandera, en las dos direcciones', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)
    await db().from('vouch_blocks').insert({ voucher_id: beto.id, vouchee_id: ana.id })

    expect(await standing(ana, beto)).toEqual({
      viewer_vouches: true,
      target_vouches_viewer: false,
      blocked_by_target: false,
    })
    expect(await standing(beto, ana)).toEqual({
      viewer_vouches: false,
      target_vouches_viewer: true,
      blocked_by_target: true,
    })
  })

  it('quien te avala con un aval en pausa sigue contando como que te avala', async () => {
    const ana = await person()
    const beto = await person()
    await give(beto, ana)
    await pauseLevel(beto.id)

    expect((await standing(ana, beto)).target_vouches_viewer).toBe(true)
  })

  it('sin perfil, ninguna fila', async () => {
    const ana = await person()
    const { data } = await db().rpc('vouch_standing', {
      p_viewer: ana.id,
      p_target_public_id: 'AAAAAAAAAAAAAAAAAAAAAA',
    })
    expect(data).toEqual([])
  })
})

describeDb('retirar un aval', () => {
  // Covers: US3-AS3, FR-017
  it('se borra, y volver a avalar es un aval nuevo, con su día', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)
    await db()
      .from('vouches')
      .update({ created_at: '2026-01-10T12:00:00Z' })
      .eq('voucher_id', ana.id)

    expect(await withdraw(ana, beto)).toBe('withdrawn')
    expect(await countVouches('vouches', ana.id, beto.id)).toBe(0)
    expect(await give(ana, beto)).toMatchObject({ outcome: 'given', created: true })
    const [row] = await myVouches(ana)
    expect(row?.given_on).not.toBe('2026-01-10')
  })

  // Covers: FR-019. Retirar lo que ya no está no es un error.
  it('lo que no está da «ya no estaba»', async () => {
    const ana = await person()
    const beto = await person()
    expect(await withdraw(ana, beto)).toBe('absent')
  })

  it('un aval en pausa se retira igual', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)
    await pauseLevel(ana.id)

    expect(await withdraw(ana, beto)).toBe('withdrawn')
  })
})
