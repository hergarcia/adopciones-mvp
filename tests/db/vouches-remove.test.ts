// Quitar un aval, «Mis avales», el mismo nivel en las tres pantallas y la baja (FR-018, FR-025,
// FR-027, SC-005).
import { afterEach, expect, it } from 'vitest'
import { publicLevel, verificationLevel } from '../../src/lib/verification/level'
import { phoneStatus } from '../../src/lib/verification/phone-status'
import { describeDb } from '../setup/env-report'
import { db } from './phone-support'
import { serviceClient, type SyntheticUser } from './roles'
import {
  countVouches,
  countingOf,
  give,
  myVouches,
  pauseLevel,
  people,
  publicProfile,
  remove,
  vouchersOf,
  withdraw,
  type Person,
} from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const person = people(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('quitar un aval', () => {
  // Covers: US4-AS1, US4-AS2, FR-018
  it('se borra, y quien lo había dado no puede volver a avalar', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)

    expect(await remove(beto, ana)).toBe('removed')
    expect(await vouchersOf(beto)).toEqual([])
    expect((await give(ana, beto)).outcome).toBe('blocked')
  })

  // FR-018: la decisión de quien quita no depende de quién llegó primero.
  it('la quita se guarda aunque el aval ya no esté', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)
    await withdraw(ana, beto)

    expect(await remove(beto, ana)).toBe('absent')
    expect(await countVouches('vouch_blocks', ana.id, beto.id)).toBe(1)
    expect((await give(ana, beto)).outcome).toBe('blocked')
  })

  // Edge Cases «Volver a avalar después de que te quitaron».
  it('es de una sola dirección: quien quitó puede avalar a quien había avalado', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)
    await remove(beto, ana)

    expect((await give(beto, ana)).outcome).toBe('given')
  })

  // Covers: FR-019
  it('un aval en pausa se quita igual', async () => {
    const ana = await person()
    const beto = await person()
    await give(ana, beto)
    await pauseLevel(beto.id)

    expect(await remove(beto, ana)).toBe('removed')
  })

  it('un id que no es de ningún perfil no guarda nada', async () => {
    const beto = await person()
    const { data } = await db().rpc('remove_vouch', {
      p_vouchee: beto.id,
      p_voucher_public_id: 'AAAAAAAAAAAAAAAAAAAAAA',
    })
    expect(data).toBe('absent')
    const { count } = await db()
      .from('vouch_blocks')
      .select('*', { count: 'exact', head: true })
      .eq('vouchee_id', beto.id)
    expect(count).toBe(0)
  })
})

describeDb('«Mis avales»', () => {
  // Covers: FR-025, US4-AS6. Solo las filas propias, y a quién le falta el nivel 2 de cada lado.
  it('las filas de la persona, con la pausa marcada de cada lado', async () => {
    const ana = await person(2, 'Ana')
    const beto = await person(2, 'Beto')
    const carla = await person(2, 'Carla')
    const dani = await person(2, 'Dani')
    await give(ana, beto)
    await give(carla, ana)
    await give(carla, dani)
    await pauseLevel(beto.id)

    const rows = await myVouches(ana)
    expect(rows).toEqual([
      expect.objectContaining({
        direction: 'given',
        other_public_id: beto.publicId,
        other_display_name: 'Beto',
        other_has_photo: false,
        mine_lacks_level_two: false,
        other_lacks_level_two: true,
      }),
      expect.objectContaining({
        direction: 'received',
        other_public_id: carla.publicId,
        mine_lacks_level_two: false,
        other_lacks_level_two: false,
      }),
    ])
    expect(JSON.stringify(rows)).not.toContain(dani.publicId)

    const betoRows = await myVouches(beto)
    expect(betoRows).toEqual([
      expect.objectContaining({
        direction: 'received',
        other_public_id: ana.publicId,
        mine_lacks_level_two: true,
        other_lacks_level_two: false,
      }),
    ])
  })
})

// SC-005: el nivel del perfil público es el mismo que calcula «Mi perfil» con sus propios datos.
async function levels(subject: Person) {
  const row = await publicProfile(subject.publicId)
  const [phone, identity] = await Promise.all([
    db().from('phones').select('*').eq('user_id', subject.id).maybeSingle(),
    db()
      .from('identity_verifications')
      .select('verified_on')
      .eq('user_id', subject.id)
      .maybeSingle(),
  ])
  const status = phoneStatus(
    phone.data
      ? {
          verifiedNumber: phone.data.verified_number,
          verifiedAt: phone.data.verified_at ? new Date(phone.data.verified_at) : null,
          pendingNumber: phone.data.pending_number,
          pendingSince: phone.data.pending_since ? new Date(phone.data.pending_since) : null,
          numberLostOn: null,
        }
      : null,
    new Date(),
  )
  const own = verificationLevel(
    status,
    identity.data ? { kind: 'approved', on: identity.data.verified_on } : { kind: 'none' },
    await countingOf(subject),
  )
  const shown = publicLevel({
    levelOne: row?.level_one ?? false,
    identitySince: row?.identity_since ?? null,
    vouchers: Array.isArray(row?.vouchers) ? row.vouchers : [],
  })
  return { own, shown }
}

describeDb('el mismo nivel en el perfil público y en «Mi perfil»', () => {
  // Covers: SC-005, FR-003
  it.each<[string, (s: { a: Person; b: Person; x: Person }) => Promise<void>, number]>([
    ['nivel 0', async ({ x }) => pauseLevel(x.id), 0],
    ['nivel 1', async () => undefined, 1],
    ['nivel 2', async () => undefined, 2],
    ['nivel 3', async ({ a, x }) => void (await give(a, x)), 3],
    [
      'en pausa por quien lo dio',
      async ({ a, x }) => {
        await give(a, x)
        await pauseLevel(a.id)
      },
      2,
    ],
    [
      'en pausa por quien lo recibió',
      async ({ a, x }) => {
        await give(a, x)
        await pauseLevel(x.id)
      },
      0,
    ],
    [
      'retirado',
      async ({ a, x }) => {
        await give(a, x)
        await withdraw(a, x)
      },
      2,
    ],
    [
      'quitado',
      async ({ a, x }) => {
        await give(a, x)
        await remove(x, a)
      },
      2,
    ],
    [
      'de una cuenta borrada',
      async ({ a, x }) => {
        await give(a, x)
        await serviceClient().auth.admin.deleteUser(a.id)
      },
      2,
    ],
    [
      'con uno que cuenta y otro en pausa',
      async ({ a, b, x }) => {
        await give(a, x)
        await give(b, x)
        await pauseLevel(b.id)
      },
      3,
    ],
  ])('%s', async (caso, arrange, expected) => {
    const a = await person()
    const b = await person()
    const x = await person(caso === 'nivel 1' ? 1 : 2)
    await arrange({ a, b, x })

    expect(await levels(x)).toEqual({ own: expected, shown: expected })
  })
})

describeDb('borrar la cuenta', () => {
  // Covers: FR-027, US3-AS11. Lo dado, lo recibido y las quitas, en las dos direcciones.
  it('se lleva sus avales y sus quitas, y quien dependía de su aval baja a nivel 2', async () => {
    const ana = await person()
    const beto = await person()
    const carla = await person()
    const dani = await person()
    await give(ana, beto)
    await give(carla, ana)
    await db()
      .from('vouch_blocks')
      .insert([
        { voucher_id: dani.id, vouchee_id: ana.id },
        { voucher_id: ana.id, vouchee_id: dani.id },
      ])

    await serviceClient().auth.admin.deleteUser(ana.id)

    const involving = async (table: 'vouches' | 'vouch_blocks') =>
      (
        await db()
          .from(table)
          .select('*', { count: 'exact', head: true })
          .or(`voucher_id.eq.${ana.id},vouchee_id.eq.${ana.id}`)
      ).count
    expect(await involving('vouches')).toBe(0)
    expect(await involving('vouch_blocks')).toBe(0)
    expect(await vouchersOf(beto)).toEqual([])
    expect(await levels(beto)).toEqual({ own: 2, shown: 2 })
  })
})
