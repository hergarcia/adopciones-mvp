// Quedarse con un número verificado en otra cuenta, en la base (historia #25): la prueba no la ve
// nadie, quedarse con el número pide una prueba vigente, se hace todo o nada, y en ninguna carrera
// el número queda en dos cuentas o se traba. Mismas reglas chicas y misma limpieza de pedidos que
// `phones.test.ts`.
import { afterEach, beforeEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  cancel,
  check,
  clearSends,
  db,
  firstRow,
  phoneOf,
  purge,
  randomNumber,
  reserve,
  settle,
  verify,
} from './phone-support'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const URUGUAY = 'America/Montevideo'

const cleanups: SyntheticUser['cleanup'][] = []

beforeEach(clearSends)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await clearSends()
})

async function person(): Promise<SyntheticUser> {
  const user = await asNewUser()
  cleanups.push(user.cleanup)
  return user
}

/** Escribe bien el código de un número que está en otra cuenta: queda la prueba. */
async function prove(userId: string, number: string) {
  const digest = `prueba-${userId}-${number}`
  const reserved = await reserve(userId, number, { digest })
  await settle(reserved.code_id)
  expect(await check(userId, digest)).toMatchObject({ verified: false, in_use: true })
}

/** Confirma quedarse con `number`, el número que la persona tiene a la vista. */
async function claim(userId: string, number: string, timeZone = URUGUAY) {
  const { data, error } = await db().rpc('claim_phone_number', {
    p_user_id: userId,
    p_number: number,
    p_time_zone: timeZone,
  })
  expect(error).toBeNull()
  return firstRow(data, 'claim_phone_number')
}

async function claimOf(userId: string) {
  const { data } = await db()
    .from('phone_claims')
    .select('number, valid_until')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

async function ownersOf(number: string): Promise<string[]> {
  const { data } = await db().from('phones').select('user_id').eq('verified_number', number)
  return (data ?? []).map((row) => row.user_id)
}

async function expireClaim(userId: string) {
  await db()
    .from('phone_claims')
    .update({ valid_until: new Date(Date.now() - 1000).toISOString() })
    .eq('user_id', userId)
}

// El día de hoy en esa zona, y su comienzo como instante. Las dos zonas de las pruebas no tienen
// horario de verano, así que el desfasaje es fijo.
function today(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function startOfToday(timeZone: string, offset: string): number {
  return Date.parse(`${today(timeZone)}T00:00:00${offset}`)
}

/** A verificada con X, B con la prueba de X. */
async function contested() {
  const ana = await person()
  const bea = await person()
  const number = randomNumber()
  await verify(ana.id, number)
  await prove(bea.id, number)
  return { ana, bea, number }
}

describeDb('la prueba, lo que no se ve', () => {
  // Covers: #25 FR-013e, SC-005
  it('no la lee ni la escribe nadie desde el cliente, tampoco la dueña', async () => {
    const { ana, bea, number } = await contested()
    const clients = [bea.client, ana.client, anonClient()]

    const reads = await Promise.all(
      clients.map(async (client) => (await client.from('phone_claims').select('*')).data ?? []),
    )
    expect(reads).toEqual([[], [], []])

    const writes = await Promise.all(
      clients.flatMap((client) => [
        client.from('phone_claims').insert({
          user_id: ana.id,
          number,
          valid_until: new Date(Date.now() + 3_600_000).toISOString(),
        }),
        client
          .from('phone_claims')
          .update({ valid_until: new Date(Date.now() + 3_600_000).toISOString() })
          .eq('user_id', bea.id),
        client.from('phone_claims').delete().eq('user_id', bea.id),
      ]),
    )
    expect(writes.every((write) => write.error !== null)).toBe(true)
    expect(await claimOf(ana.id)).toBeNull()
    expect(await claimOf(bea.id)).toMatchObject({ number })
  })

  // Covers: #25 FR-013f
  it('`phones` ya no guarda cuándo cambió por última vez', async () => {
    const { error } = await serviceClient().from('phones').select('updated_at').limit(1)
    expect(error).not.toBeNull()
  })
})

describeDb('quedarse con el número', () => {
  // Covers: #25 US1-AS3, FR-007.1, FR-007.3, FR-013f, SC-001
  it('el número pasa de A a B: A sin verificado y con el día, B verificada desde el día', async () => {
    const { ana, bea, number } = await contested()

    const result = await claim(bea.id, number)
    expect(result).toEqual({
      outcome: 'claimed',
      was_change: false,
      was_lost: false,
      previous_user_id: ana.id,
      lost_on: today(URUGUAY),
    })

    expect(await phoneOf(ana.id)).toEqual({
      verified_number: null,
      verified_at: null,
      pending_number: null,
      pending_since: null,
      number_lost_on: today(URUGUAY),
    })
    const b = await phoneOf(bea.id)
    expect(b).toMatchObject({ verified_number: number, pending_number: null, number_lost_on: null })
    expect(Date.parse(b?.verified_at ?? '')).toBe(startOfToday(URUGUAY, '-03:00'))
    expect(await claimOf(bea.id)).toBeNull()
  })

  // Covers: #25 FR-013f. La base no deja fijar su reloj: una zona cuyo día difiere del de UTC
  // prueba que el día sale del parámetro.
  it('el día sale de la zona que se le pasa, no de UTC', async () => {
    const { ana, bea, number } = await contested()
    const zone = 'Pacific/Kiritimati'

    expect((await claim(bea.id, number, zone)).lost_on).toBe(today(zone))
    expect((await phoneOf(ana.id))?.number_lost_on).toBe(today(zone))
    expect(Date.parse((await phoneOf(bea.id))?.verified_at ?? '')).toBe(
      startOfToday(zone, '+14:00'),
    )
  })

  // Covers: #25 US1-AS9, FR-007.2
  it('si B tenía otro verificado, lo suelta y queda libre para otra cuenta', async () => {
    const { bea, number } = await contested()
    const previous = randomNumber()
    await verify(bea.id, previous)
    await prove(bea.id, number)

    expect(await claim(bea.id, number)).toMatchObject({ outcome: 'claimed', was_change: true })
    expect((await phoneOf(bea.id))?.verified_number).toBe(number)

    const carla = await person()
    expect(await verify(carla.id, previous)).toMatchObject({ verified: true })
  })

  // Covers: #25 Edge Cases «Número a medias en la cuenta nueva»
  it('B queda sin número a medias, y un código que tenía en camino ya no revive nada', async () => {
    const { bea, number } = await contested()
    const other = randomNumber()
    const inFlight = await reserve(bea.id, other, { digest: 'en-camino' })

    expect(await claim(bea.id, number)).toMatchObject({ outcome: 'claimed' })
    await settle(inFlight.code_id)

    expect(await phoneOf(bea.id)).toMatchObject({ verified_number: number, pending_number: null })
    expect(await check(bea.id, 'en-camino')).toMatchObject({ verified: false, no_pending: true })
  })

  // Covers: #25 FR-009
  it('si la otra cuenta ya no lo tiene, se verifica como uno común y no se toca a nadie', async () => {
    const { ana, bea, number } = await contested()
    const other = randomNumber()
    await verify(ana.id, other)

    expect(await claim(bea.id, number)).toEqual({
      outcome: 'verified_free',
      was_change: false,
      was_lost: false,
      previous_user_id: null,
      lost_on: null,
    })
    expect((await phoneOf(bea.id))?.verified_number).toBe(number)
    expect(await phoneOf(ana.id)).toMatchObject({ verified_number: other, number_lost_on: null })
  })

  // Covers: #25 FR-013e
  it('la función devuelve y borra solo la prueba de esa cuenta', async () => {
    const { bea, number } = await contested()
    const carla = await person()
    await prove(carla.id, number)

    const { error } = await serviceClient().rpc('drop_phone_claim', { p_user_id: bea.id })
    expect(error).toBeNull()
    expect(await claimOf(bea.id)).toBeNull()
    expect(await claimOf(carla.id)).toMatchObject({ number })
  })
})

describeDb('sin una prueba vigente, nada cambia', () => {
  async function expectNothingChanged(anaId: string, beaId: string, number: string) {
    expect(await claim(beaId, number)).toMatchObject({
      outcome: 'no_claim',
      previous_user_id: null,
    })
    expect(await ownersOf(number)).toEqual([anaId])
    expect((await phoneOf(anaId))?.number_lost_on).toBeNull()
  }

  // Covers: #25 FR-013c, SC-003
  it('sin haber escrito el código', async () => {
    const ana = await person()
    const bea = await person()
    const number = randomNumber()
    await verify(ana.id, number)
    expect(await claimOf(bea.id)).toBeNull()
    await expectNothingChanged(ana.id, bea.id, number)
  })

  // Covers: #25 US1-AS5, FR-013e
  it('pasada la hora límite, aunque la purga todavía no la haya borrado', async () => {
    const { ana, bea, number } = await contested()
    await expireClaim(bea.id)
    expect(await claimOf(bea.id)).toMatchObject({ number })
    await expectNothingChanged(ana.id, bea.id, number)
  })

  // Covers: #25 FR-005
  it('después de pedir otro código que salió', async () => {
    const { ana, bea, number } = await contested()
    const reserved = await reserve(bea.id, randomNumber())
    await settle(reserved.code_id)
    expect(await claimOf(bea.id)).toBeNull()
    await expectNothingChanged(ana.id, bea.id, number)
  })

  // Covers: #25 FR-005
  it('después de pedir otro código que el tope por número frenó en silencio', async () => {
    const { ana, bea, number } = await contested()
    const skipped = await reserve(bea.id, randomNumber(), { rules: { p_number_cap: 0 } })
    expect(skipped.decision).toBe('skip')
    expect(await claimOf(bea.id)).toBeNull()
    await expectNothingChanged(ana.id, bea.id, number)
  })

  // Covers: #25 FR-005. Un pedido que no salió no cambia nada, como en la #10.
  it('un pedido frenado por la espera o el tope, o que falló al salir, no la borra', async () => {
    const { bea, number } = await contested()

    const waited = await reserve(bea.id, randomNumber(), { rules: { p_min_gap: '1 hour' } })
    expect(waited.decision).toBe('wait')
    const capped = await reserve(bea.id, randomNumber(), { rules: { p_account_cap: 1 } })
    expect(capped.decision).toBe('daily_cap')
    const failed = await reserve(bea.id, randomNumber())
    await settle(failed.code_id, 'failed')

    expect(await claimOf(bea.id)).toMatchObject({ number })
    expect(await claim(bea.id, number)).toMatchObject({ outcome: 'claimed' })
  })

  // Covers: #25 FR-006. Otra pestaña escribió el código de otro número en uso, y la confirmación
  // vieja todavía muestra el primero: confirmarlo no se queda con el segundo, que nadie confirmó.
  it('confirmando un número que ya no es el de la prueba', async () => {
    const { ana, bea, number } = await contested()
    const carla = await person()
    const other = randomNumber()
    await verify(carla.id, other)
    await prove(bea.id, other)

    await expectNothingChanged(ana.id, bea.id, number)
    expect(await ownersOf(other)).toEqual([carla.id])
    expect((await phoneOf(carla.id))?.number_lost_on).toBeNull()
    expect(await claimOf(bea.id)).toMatchObject({ number: other })
  })

  // Covers: #25 FR-013c. La prueba es de la cuenta que escribió el código.
  it('desde otra cuenta que no escribió el código', async () => {
    const { ana, bea, number } = await contested()
    const carla = await person()
    await expectNothingChanged(ana.id, carla.id, number)
    expect(await claimOf(bea.id)).toMatchObject({ number })
  })

  // Covers: #25 FR-005, FR-009a
  it('si el número se verificó en otra cuenta después, las pruebas ajenas se borran', async () => {
    const { ana, bea, number } = await contested()
    await verify(ana.id, randomNumber())
    const carla = await person()
    expect(await verify(carla.id, number)).toMatchObject({ verified: true })

    expect(await claimOf(bea.id)).toBeNull()
    await expectNothingChanged(carla.id, bea.id, number)
  })
})

describeDb('las carreras', () => {
  // Covers: #25 FR-009a, SC-002
  it('dos reclamos del mismo número con dueño: uno gana, el número en una sola cuenta', async () => {
    const { ana, bea, number } = await contested()
    const carla = await person()
    await prove(carla.id, number)

    const results = await Promise.all([claim(bea.id, number), claim(carla.id, number)])
    expect(results.map((result) => result.outcome).sort()).toEqual(['claimed', 'no_claim'])
    const [winner] = await ownersOf(number)
    expect(await ownersOf(number)).toHaveLength(1)
    expect([bea.id, carla.id]).toContain(winner)
    expect((await phoneOf(ana.id))?.number_lost_on).toBe(today(URUGUAY))
  })

  // Covers: #25 FR-009a, SC-002
  it('dos reclamos de un número libre: uno gana', async () => {
    const { ana, bea, number } = await contested()
    const carla = await person()
    await prove(carla.id, number)
    await verify(ana.id, randomNumber())

    const results = await Promise.all([claim(bea.id, number), claim(carla.id, number)])
    expect(results.map((result) => result.outcome).sort()).toEqual(['no_claim', 'verified_free'])
    expect(await ownersOf(number)).toHaveLength(1)
  })

  // Covers: #25 FR-009a, SC-002
  it('un reclamo y la verificación común del número en una tercera cuenta: uno gana', async () => {
    const { ana, bea, number } = await contested()
    await verify(ana.id, randomNumber())
    const carla = await person()
    const reserved = await reserve(carla.id, number, { digest: 'de-carla' })
    await settle(reserved.code_id)

    const [claimed, checked] = await Promise.all([
      claim(bea.id, number),
      check(carla.id, 'de-carla'),
    ])
    expect([
      ['verified_free', false, true],
      ['no_claim', true, false],
    ]).toContainEqual([claimed.outcome, checked.verified, checked.in_use])
    expect(await ownersOf(number)).toEqual([
      claimed.outcome === 'verified_free' ? bea.id : carla.id,
    ])
  })

  // Covers: #25 SC-002. Los candados de cuenta en orden de id: dos reclamos cruzados no se traban.
  it('reclamos cruzados terminan sin trabarse, cada número en una sola cuenta', async () => {
    const ana = await person()
    const bea = await person()
    const x = randomNumber()
    const y = randomNumber()
    await verify(ana.id, x)
    await verify(bea.id, y)
    await prove(ana.id, y)
    await prove(bea.id, x)

    await Promise.all([claim(ana.id, y), claim(bea.id, x)])
    expect(await ownersOf(x)).toHaveLength(1)
    expect(await ownersOf(y)).toHaveLength(1)
  })

  // Covers: #25 Edge Cases «La cuenta anterior está haciendo algo con su teléfono»
  it('un reclamo mientras A termina un cambio: B se queda con el número, A con el nuevo', async () => {
    const { ana, bea, number } = await contested()
    const next = randomNumber()
    const reserved = await reserve(ana.id, next, { digest: 'cambio' })
    await settle(reserved.code_id)

    await Promise.all([claim(bea.id, number), check(ana.id, 'cambio')])
    expect(await ownersOf(number)).toEqual([bea.id])
    expect(await phoneOf(ana.id)).toMatchObject({
      verified_number: next,
      pending_number: null,
      number_lost_on: null,
    })
  })

  // Covers: #25 Edge Cases «La cuenta anterior está haciendo algo con su teléfono»
  it('un reclamo mientras A cancela un cambio: se hacen de a uno y A queda con el aviso', async () => {
    const { ana, bea, number } = await contested()
    const reserved = await reserve(ana.id, randomNumber())
    await settle(reserved.code_id)

    await Promise.all([claim(bea.id, number), cancel(ana.id)])
    expect(await ownersOf(number)).toEqual([bea.id])
    expect(await phoneOf(ana.id)).toEqual({
      verified_number: null,
      verified_at: null,
      pending_number: null,
      pending_since: null,
      number_lost_on: today(URUGUAY),
    })
  })
})

describeDb('la prueba se va', () => {
  // Covers: #25 FR-013e
  it('la purga borra las vencidas y deja las vigentes', async () => {
    const { bea, number } = await contested()
    const carla = await person()
    await prove(carla.id, number)
    await expireClaim(bea.id)

    await purge()
    expect(await claimOf(bea.id)).toBeNull()
    expect(await claimOf(carla.id)).toMatchObject({ number })
  })

  // Covers: #25 Edge Cases «La cuenta nueva se borra con una prueba vigente»
  it('borrar la cuenta borra su prueba', async () => {
    const ana = await person()
    const bea = await asNewUser()
    const number = randomNumber()
    await verify(ana.id, number)
    await prove(bea.id, number)

    await bea.cleanup()
    const { data } = await db().from('phone_claims').select('user_id').eq('user_id', bea.id)
    expect(data).toEqual([])
  })
})

describeDb('la cuenta que pierde el número', () => {
  // Covers: #25 US2-AS3, FR-007.4, FR-011b, FR-014
  it('conserva su cambio a medias y su código, y al terminarlo el aviso se va', async () => {
    const { ana, bea, number } = await contested()
    const next = randomNumber()
    const reserved = await reserve(ana.id, next, { digest: 'cambio' })
    await settle(reserved.code_id)

    await claim(bea.id, number)
    expect(await phoneOf(ana.id)).toMatchObject({
      verified_number: null,
      pending_number: next,
      number_lost_on: today(URUGUAY),
    })

    expect(await check(ana.id, 'cambio')).toMatchObject({ verified: true, was_lost: true })
    expect(await phoneOf(ana.id)).toMatchObject({ verified_number: next, number_lost_on: null })
  })

  // Covers: #25 FR-013b, SC-005
  it('el día lo lee solo su dueña, y ni ella lo cambia ni lo borra', async () => {
    const { ana, bea, number } = await contested()
    await claim(bea.id, number)

    const own = await ana.client.from('phones').select('number_lost_on').eq('user_id', ana.id)
    expect(own.data).toEqual([{ number_lost_on: today(URUGUAY) }])
    const other = await bea.client.from('phones').select('*').eq('user_id', ana.id)
    expect(other.data).toEqual([])
    const anon = await anonClient().from('phones').select('*').eq('user_id', ana.id)
    expect(anon.data ?? []).toEqual([])

    const update = await ana.client
      .from('phones')
      .update({ number_lost_on: null })
      .eq('user_id', ana.id)
    const remove = await ana.client.from('phones').delete().eq('user_id', ana.id)
    expect([update.error, remove.error].every((error) => error !== null)).toBe(true)
    expect((await phoneOf(ana.id))?.number_lost_on).toBe(today(URUGUAY))
  })

  // Covers: #25 FR-011a, FR-013a. Una fila con solo el día no está vacía: es el aviso.
  it('la purga, cancelar y "número en uso" no se llevan el aviso', async () => {
    const { ana, bea, number } = await contested()
    await claim(bea.id, number)

    await purge()
    await cancel(ana.id)
    const carla = await person()
    const taken = randomNumber()
    await verify(carla.id, taken)
    await prove(ana.id, taken)

    expect(await phoneOf(ana.id)).toMatchObject({
      verified_number: null,
      pending_number: null,
      number_lost_on: today(URUGUAY),
    })
  })

  // Covers: #25 US2-AS4, FR-011c
  it('si vuelve a demostrar que lo tiene, se lo queda de vuelta y el aviso pasa a la otra', async () => {
    const { ana, bea, number } = await contested()
    await claim(bea.id, number)
    await prove(ana.id, number)

    expect(await claim(ana.id, number)).toMatchObject({
      outcome: 'claimed',
      was_lost: true,
      previous_user_id: bea.id,
    })
    expect(await phoneOf(ana.id)).toMatchObject({ verified_number: number, number_lost_on: null })
    expect(await phoneOf(bea.id)).toMatchObject({
      verified_number: null,
      number_lost_on: today(URUGUAY),
    })
  })
})
