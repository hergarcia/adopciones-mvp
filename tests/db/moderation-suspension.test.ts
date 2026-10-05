// Suspender y reactivar (historia #13, US2): la suspensión cierra los reportes y retira el pedido de
// identidad; mientras dura, la cuenta se ve como una que no existe en cada lectura que la nombra;
// al reactivar todo vuelve, y el vencimiento se corre lo que duró. Lo que no debe verse —las
// suspensiones para la suspendida, para otra persona y sin sesión— se demuestra con un intento que
// falla.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { imagesOf, openRequest } from './identity-support'
import { inDays, msFrom, petRow, setExpiry, setState } from './lifecycle-support'
import { futureWindow, listPet, listedAfter, sql } from './listing-support'
import {
  moderationPeople,
  openSuspensionOf,
  queueOf,
  reactivateAs,
  readAs,
  report,
  reportsAbout,
  suspend,
  suspendAs,
  suspendedListOf,
  type Person,
} from './moderation-support'
import { PENDING_TTL } from './pet-support'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'
import { countingOf, give, myVouches, publicProfile, vouchersOf } from './vouch-support'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = moderationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']

async function deleteAccount(userId: string) {
  const { error } = await serviceClient().auth.admin.deleteUser(userId)
  expect(error).toBeNull()
}

async function byCode(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_by_code', { p_code: code })
  expect(error).toBeNull()
  const rows: { visibility: string; name: string | null }[] = data ?? []
  return rows
}

async function shareCard(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_share_card', { p_code: code })
  expect(error).toBeNull()
  return data ?? []
}

async function signs(client: Client, path: string): Promise<boolean> {
  const { data } = await client.storage.from('pet-photos').createSignedUrl(path, 60)
  return data !== null
}

async function reviewQueueOf(client: Client): Promise<string[]> {
  const { data, error } = await client.rpc('pet_review_queue', { p_limit: 100 })
  expect(error).toBeNull()
  return (data ?? []).map((row: { pet_id: string }) => row.pet_id)
}

async function claimed(fn: 'claim_pet_reminders' | 'claim_pet_expiries', petId: string) {
  const before = await petRow(petId)
  await db().rpc(fn, { p_limit: 100_000 })
  const after = await petRow(petId)
  return fn === 'claim_pet_reminders'
    ? before?.reminder_sent_at !== after?.reminder_sent_at
    : before?.expiry_counted_at !== after?.expiry_counted_at
}

async function renewalLink(petId: string): Promise<string> {
  const tokenHash = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '')
  const { error } = await db().rpc('create_pet_renewal_link', {
    p_pet: petId,
    p_token_hash: tokenHash,
  })
  expect(error).toBeNull()
  return tokenHash
}

async function isAdminAs(client: Client): Promise<boolean> {
  const { data, error } = await client.rpc('count_open_reports')
  expect(error).toBeNull()
  // Sin administrar, la cuenta es siempre cero; con un reporte sin resolver, quien administra ve uno.
  return (data?.[0]?.others ?? 0) > 0
}

/** Una persona con un animal a la vista en su propia ventana del listado. */
async function withPet(owner: Person) {
  const window = futureWindow()
  const pet = await listPet(owner.id, { publishedAt: window.at(1), upload: true })
  return { ...pet, window, photo: `${owner.id}/${pet.photoIds[0]}/card.webp` }
}

describeDb('suspender una cuenta', () => {
  // Covers: US2-AS1, US2-AS2, FR-012, FR-018
  it('desde un reporte guarda quién y cuándo, y cierra todos sus reportes sin resolver', async () => {
    const [lucia, marta, beto, ana] = [
      await admin('Lucía'),
      await person(1),
      await person(1),
      await person(1, 'Ana'),
    ]
    const first = await report(marta, ana, 'sells_animals')
    await report(beto, ana, 'scam')
    expect(first.outcome).toBe('created')
    const [fromReport] = await reportsAbout(ana.id)

    const done = await suspendAs(lucia.client, ana, '  Ofrecía cachorros  ', fromReport?.id ?? null)
    expect(done).toMatchObject({
      outcome: 'done',
      user_id: ana.id,
      display_name: 'Ana',
      withdrew_request: false,
    })
    const suspension = await openSuspensionOf(ana.id)
    expect(suspension).toMatchObject({ reason: 'Ofrecía cachorros', suspended_by: lucia.id })
    expect(done.suspended_at).toBe(suspension?.suspended_at)

    const reports = await reportsAbout(ana.id)
    expect(reports.map((row) => [row.resolution, row.resolved_by, row.suspension_id])).toEqual([
      ['suspended', lucia.id, suspension?.id],
      ['suspended', lucia.id, suspension?.id],
    ])
    expect(done.closed_reports).toEqual(reports.map((row) => row.created_at))
    expect(await queueOf(lucia.client)).toEqual([])
  })

  // Covers: US2-AS2
  it('desde el perfil, sin reportes, no cierra nada', async () => {
    const [lucia, ana] = [await admin(), await person(1)]
    const done = await suspendAs(lucia.client, ana)
    expect(done.outcome).toBe('done')
    expect(done.closed_reports).toEqual([])
  })

  // Covers: US2-AS5
  it('retira el pedido de identidad en revisión y borra sus imágenes; lo verificado queda', async () => {
    const [lucia, ana, bea] = [await admin(), await person(1), await person(2)]
    const requestId = await openRequest(ana.id)
    expect(await imagesOf(requestId)).toBe(2)

    expect((await suspendAs(lucia.client, ana)).withdrew_request).toBe(true)
    expect(await imagesOf(requestId)).toBe(0)
    const { count } = await db()
      .from('identity_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ana.id)
    expect(count).toBe(0)

    expect((await suspendAs(lucia.client, bea)).withdrew_request).toBe(false)
    const { data } = await db()
      .from('identity_verifications')
      .select('user_id')
      .eq('user_id', bea.id)
    expect(data).toEqual([{ user_id: bea.id }])
  })

  // Covers: FR-010, US2-AS11
  it('NO se suspende a sí misma', async () => {
    const lucia = await admin()
    const self = await suspendAs(lucia.client, lucia)
    expect(self.outcome).toBe('self')
    expect(await openSuspensionOf(lucia.id)).toBeNull()
  })

  // Covers: Edge Cases (dos personas que administran suspenden a la vez)
  it('la segunda ve que ya estaba suspendida, por quién y cuándo, y queda una sola', async () => {
    const [lucia, pedro, ana] = [await admin('Lucía'), await admin('Pedro'), await person(1)]
    const first = await suspendAs(lucia.client, ana, 'Primero')
    const second = await suspendAs(pedro.client, ana, 'Segundo')

    expect(second).toMatchObject({
      outcome: 'already',
      suspended_by_name: 'Lucía',
      suspended_at: first.suspended_at,
      user_id: null,
    })
    const { data } = await db().from('account_suspensions').select('reason').eq('user_id', ana.id)
    expect(data).toEqual([{ reason: 'Primero' }])
  })

  // Covers: US2-AS3 (la base también lo frena)
  it('sin motivo, o con solo espacios, no suspende', async () => {
    const [lucia, ana] = [await admin(), await person(1)]
    const calls = await Promise.all(
      ['', '   '].map((reason) =>
        lucia.client.rpc('suspend_account', {
          p_target_public_id: ana.publicId,
          p_reason: reason,
        }),
      ),
    )
    expect(calls.map(({ error }) => error?.code)).toEqual(['23514', '23514'])
    expect(await openSuspensionOf(ana.id)).toBeNull()
  })

  // Covers: FR-032, US2-AS10
  it('not_admin para quien no administra y para una suspendida que administra; gone si se borró', async () => {
    const [marta, pedro, lucia, ana] = [
      await person(1),
      await admin(),
      await admin(),
      await person(1),
    ]
    await suspend(pedro.id)

    expect((await suspendAs(marta.client, ana)).outcome).toBe('not_admin')
    expect((await suspendAs(pedro.client, ana)).outcome).toBe('not_admin')
    expect(await openSuspensionOf(ana.id)).toBeNull()

    const { error } = await anonClient().rpc('suspend_account', {
      p_target_public_id: ana.publicId,
      p_reason: 'Motivo',
    })
    expect(error?.code).toBe('42501')

    const reported = await report(marta, ana)
    expect(reported.outcome).toBe('created')
    const [open] = await reportsAbout(ana.id)
    await deleteAccount(ana.id)
    expect((await suspendAs(lucia.client, ana)).outcome).toBe('gone')
    expect((await suspendAs(lucia.client, marta, 'Motivo', open?.id ?? null)).outcome).toBe('gone')
    expect(await openSuspensionOf(marta.id)).toBeNull()
  })
})

describeDb('mientras dura la suspensión, la cuenta no existe para nadie más', () => {
  // Covers: FR-020, US2-AS1, US2-AS7
  it('su perfil, sus animales, sus fotos y su vista previa dejan de verse', async () => {
    const [lucia, marta, ana] = [await admin(), await person(1), await person(1, 'Ana')]
    const pet = await withPet(ana)
    const visitors = [anonClient(), marta.client]
    for (const client of visitors) {
      // oxlint-disable-next-line no-await-in-loop -- dos visitantes, uno detrás del otro
      expect((await listedAfter(client, pet.window)).map((row) => row.code)).toEqual([pet.code])
    }

    await suspendAs(lucia.client, ana)

    expect(await publicProfile(ana.publicId)).toBeNull()
    for (const client of [...visitors, lucia.client]) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await listedAfter(client, pet.window)).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      expect(await byCode(client, pet.code)).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      expect(await shareCard(client, pet.code)).toEqual([])
      // oxlint-disable-next-line no-await-in-loop
      expect(await signs(client, pet.photo)).toBe(false)
    }
  })

  // Covers: FR-020, US2-AS4
  it('sus avales dejan de contar y de verse: la avalada baja de 3 a 2', async () => {
    const [lucia, ana, bea] = [await admin(), await person(2, 'Ana'), await person(2, 'Bea')]
    expect((await give(ana, bea)).outcome).toBe('given')
    expect(await vouchersOf(bea)).toEqual([ana.publicId])
    expect(await countingOf(bea)).toBe(1)

    await suspendAs(lucia.client, ana)

    expect(await vouchersOf(bea)).toEqual([])
    expect(await countingOf(bea)).toBe(0)
    expect(await myVouches(bea)).toEqual([])
  })

  // Covers: FR-020 (Publicaciones por revisar, el recordatorio y el vencimiento)
  it('la revisión, el recordatorio y el vencimiento la saltean', async () => {
    const [lucia, ana] = [await admin(), await person(1)]
    const waiting = await listPet(ana.id)
    const soon = await listPet(ana.id)
    await setExpiry(soon.petId, inDays(3))
    const gone = await listPet(ana.id)
    await setState(gone.petId, 'expired')
    expect(await reviewQueueOf(lucia.client)).toContain(waiting.petId)

    await suspendAs(lucia.client, ana)

    expect(await reviewQueueOf(lucia.client)).not.toContain(waiting.petId)
    expect(await claimed('claim_pet_reminders', soon.petId)).toBe(false)
    expect(await claimed('claim_pet_expiries', gone.petId)).toBe(false)
  })

  // Covers: FR-019, Edge Cases (un «Sigue disponible» de antes)
  it('un enlace «Sigue disponible» de antes no renueva ni muestra nada', async () => {
    const [lucia, ana] = [await admin(), await person(1)]
    const pet = await listPet(ana.id)
    await setExpiry(pet.petId, inDays(3))
    const link = await renewalLink(pet.petId)
    expect(await db().rpc('renewal_link_view', { p_token_hash: link })).toMatchObject({
      data: [expect.objectContaining({ name: 'Luna' })],
    })
    const before = (await petRow(pet.petId))?.expires_at

    await suspendAs(lucia.client, ana)

    const renewed = await db().rpc('renew_by_link', {
      p_token_hash: link,
      p_pending_ttl: PENDING_TTL,
    })
    expect(renewed.data).toEqual([
      { outcome: 'invalid', pet_name: null, sex: null, expires_at: null },
    ])
    expect((await db().rpc('renewal_link_view', { p_token_hash: link })).data).toEqual([])
    expect((await petRow(pet.petId))?.expires_at).toBe(before)
  })

  // Covers: US2-AS6 (la suspendida que administra no abre nada), research R2
  it('una suspendida que administra deja de administrar', async () => {
    const [lucia, pedro, marta, ana] = [
      await admin(),
      await admin(),
      await person(1),
      await person(1),
    ]
    await report(marta, ana)
    expect(await isAdminAs(pedro.client)).toBe(true)

    await suspendAs(lucia.client, pedro)

    expect(await isAdminAs(pedro.client)).toBe(false)
    expect(await queueOf(pedro.client)).toEqual([])
    expect(await suspendedListOf(pedro.client)).toEqual([])
  })

  // Covers: FR-019 (la puerta pregunta acá)
  it('my_account_standing dice el motivo y desde cuándo solo a ella', async () => {
    const [lucia, ana] = [await admin(), await person(1)]
    const done = await suspendAs(lucia.client, ana, 'Motivo para Ana')

    expect((await ana.client.rpc('my_account_standing')).data).toEqual([
      { reason: 'Motivo para Ana', since: done.suspended_at },
    ])
    expect((await lucia.client.rpc('my_account_standing')).data).toEqual([])
    expect((await anonClient().rpc('my_account_standing')).error?.code).toBe('42501')
  })
})

describeDb('reactivar', () => {
  // Covers: US2-AS9, FR-023
  it('todo vuelve: el perfil, los avales, los animales con el mismo enlace', async () => {
    const [lucia, ana, bea] = [await admin('Lucía'), await person(2, 'Ana'), await person(2)]
    await give(ana, bea)
    const pet = await withPet(ana)
    const suspended = await suspendAs(lucia.client, ana)
    const suspension = await openSuspensionOf(ana.id)

    const back = await reactivateAs(lucia.client, suspension?.id ?? '')
    expect(back).toMatchObject({ outcome: 'done', user_id: ana.id, display_name: 'Ana' })
    const lifted = await db()
      .from('account_suspensions')
      .select('lifted_by, lifted_at')
      .eq('id', suspension?.id ?? '')
      .single()
    expect(lifted.data).toEqual({ lifted_by: lucia.id, lifted_at: back.lifted_at })
    expect(suspended.outcome).toBe('done')

    expect((await publicProfile(ana.publicId))?.display_name).toBe('Ana')
    expect(await vouchersOf(bea)).toEqual([ana.publicId])
    expect(await countingOf(bea)).toBe(1)
    expect((await listedAfter(anonClient(), pet.window)).map((row) => row.code)).toEqual([pet.code])
    expect((await byCode(anonClient(), pet.code))[0]?.visibility).toBe('listed')
    expect(await signs(anonClient(), pet.photo)).toBe(true)
  })

  // Covers: Edge Cases (el vencimiento durante la suspensión), research R3
  it('el vencimiento se corre lo que duró la suspensión; una vencida antes sigue vencida', async () => {
    const [lucia, ana] = [await admin(), await person(1)]
    const running = await listPet(ana.id)
    await setExpiry(running.petId, inDays(10))
    const expired = await listPet(ana.id)
    await setState(expired.petId, 'expired')
    // Vencida antes de que empiece la suspensión, que abajo se corre cinco días hacia atrás.
    await setExpiry(expired.petId, inDays(-6))
    const paused = await listPet(ana.id)
    await setState(paused.petId, 'paused')
    const before = await Promise.all([running, expired].map(({ petId }) => petRow(petId)))

    await suspendAs(lucia.client, ana)
    const suspension = await openSuspensionOf(ana.id)
    // Cinco días suspendida: se corre la fecha de la suspensión hacia atrás.
    await sql(
      `update public.account_suspensions set suspended_at = suspended_at - interval '5 days' where id = '${suspension?.id ?? ''}'`,
    )
    await reactivateAs(lucia.client, suspension?.id ?? '')

    const lifted = await db()
      .from('account_suspensions')
      .select('suspended_at, lifted_at')
      .eq('id', suspension?.id ?? '')
      .single()
    const lasted =
      new Date(String(lifted.data?.lifted_at)).getTime() -
      new Date(String(lifted.data?.suspended_at)).getTime()
    expect(Math.round(lasted / 86_400_000)).toBe(5)

    const after = await petRow(running.petId)
    // La base guarda microsegundos; JavaScript, milisegundos.
    expect(
      msFrom(after?.expires_at, new Date(String(before[0]?.expires_at)).getTime() + lasted),
    ).toBeLessThanOrEqual(1)
    expect((await petRow(expired.petId))?.expires_at).toBe(before[1]?.expires_at)
    expect((await petRow(paused.petId))?.expires_at).toBeNull()
  })

  // Covers: Edge Cases (dos reactivan a la vez), FR-032, US2-AS10
  it('already, gone y not_admin', async () => {
    const [lucia, pedro, marta, ana, bea] = [
      await admin('Lucía'),
      await admin(),
      await person(1),
      await person(1),
      await person(1),
    ]
    await suspendAs(lucia.client, ana)
    const anaSuspension = (await openSuspensionOf(ana.id))?.id ?? ''

    expect((await reactivateAs(marta.client, anaSuspension)).outcome).toBe('not_admin')
    expect(await openSuspensionOf(ana.id)).not.toBeNull()

    const first = await reactivateAs(lucia.client, anaSuspension)
    expect(await reactivateAs(pedro.client, anaSuspension)).toMatchObject({
      outcome: 'already',
      lifted_by_name: 'Lucía',
      lifted_at: first.lifted_at,
    })

    await suspendAs(lucia.client, bea)
    const beaSuspension = (await openSuspensionOf(bea.id))?.id ?? ''
    await deleteAccount(bea.id)
    expect((await reactivateAs(lucia.client, beaSuspension)).outcome).toBe('gone')
  })
})

describeDb('la lista de cuentas suspendidas', () => {
  // Covers: FR-022, FR-025, US2-AS10, FR-033
  it('las vigentes, de la más reciente a la más vieja, solo para quien administra', async () => {
    const [lucia, pedro, marta, ana, bea, caro] = [
      await admin('Lucía'),
      await admin('Pedro'),
      await person(1),
      await person(1, 'Ana'),
      await person(1, 'Bea'),
      await person(1, 'Caro'),
    ]
    await suspendAs(lucia.client, ana, 'Primera')
    await suspendAs(pedro.client, bea, 'Segunda')
    await suspendAs(lucia.client, caro, 'Tercera')
    await reactivateAs(lucia.client, (await openSuspensionOf(caro.id))?.id ?? '')
    await deleteAccount(pedro.id)

    const mine = (await suspendedListOf(lucia.client)).filter((row) =>
      [ana.publicId, bea.publicId, caro.publicId].includes(row.public_id),
    )
    expect(mine.map((row) => [row.display_name, row.reason, row.suspended_by_name])).toEqual([
      ['Bea', 'Segunda', null],
      ['Ana', 'Primera', 'Lucía'],
    ])
    expect(await suspendedListOf(marta.client)).toEqual([])
    expect(await suspendedListOf(ana.client)).toEqual([])
    expect((await anonClient().rpc('suspended_accounts')).error?.code).toBe('42501')
  })
})

describeDb('quién lee las suspensiones', () => {
  // Covers: FR-025, FR-042 (las dos caras)
  it('quien administra las lee; la suspendida, otra persona y sin sesión, no', async () => {
    const [lucia, marta, ana] = [await admin(), await person(1), await person(1)]
    await suspendAs(lucia.client, ana)

    const adminRows = (await readAs(lucia.client, 'account_suspensions')).rows
    expect(adminRows.map((row) => Reflect.get(row, 'user_id'))).toContain(ana.id)
    for (const client of [ana.client, marta.client, anonClient()]) {
      // oxlint-disable-next-line no-await-in-loop -- tres lectores, uno detrás del otro
      const { rows } = await readAs(client, 'account_suspensions')
      expect(rows).toEqual([])
    }
  })
})
