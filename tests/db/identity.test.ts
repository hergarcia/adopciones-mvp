// La verificación de identidad en la base (historia #11): lo que un rol NO ve, lo que nadie puede
// escribir desde el cliente, y las reglas que viven en las funciones porque tienen consecuencias
// —el pedido único, el tope, el retiro, la resolución, el vencimiento—, incluidas las carreras que
// las justifican. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  NEW_TABLES,
  addRejections,
  countRows,
  daysAgo,
  imagesOf,
  makeExpired,
  openRequest,
  people,
  resolve,
  submit,
  withdraw,
} from './identity-support'
import { db } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const person = people(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('pedir la verificación de identidad', () => {
  // Covers: US1-AS4, US1-AS9, FR-008
  it('enviar deja el pedido en revisión con sus dos imágenes', async () => {
    const ana = await person()
    const id = await openRequest(ana.id)

    expect(await countRows('identity_requests', 'user_id', ana.id)).toBe(1)
    expect(await imagesOf(id)).toBe(2)
  })

  // Covers: US1-AS8, FR-002. La cuenta pudo bajar a sin verificar entre la pantalla y el envío.
  it('sin nivel 1 no guarda nada', async () => {
    const marta = await person({ levelOne: false })
    expect((await submit(marta.id)).decision).toBe('no_phone')
    expect(await countRows('identity_requests', 'user_id', marta.id)).toBe(0)
  })

  // Covers: US1-AS5, FR-009
  it('con un pedido abierto no se abre otro', async () => {
    const ana = await person()
    const id = await openRequest(ana.id)

    expect((await submit(ana.id)).decision).toBe('already_open')
    expect(await countRows('identity_requests', 'user_id', ana.id)).toBe(1)
    expect(await imagesOf(id)).toBe(2)
  })

  // Covers: FR-009, SC-004. Sin el candado, cinco envíos en paralelo pasan el chequeo a la vez.
  it('cinco envíos en paralelo dejan un solo pedido', async () => {
    const ana = await person()
    const decisions = await Promise.all(Array.from({ length: 5 }, () => submit(ana.id)))

    expect(decisions.filter((sent) => sent.decision === 'sent')).toHaveLength(1)
    expect(await countRows('identity_requests', 'user_id', ana.id)).toBe(1)
  })

  // Covers: US3-AS1, FR-027
  it('con 3 rechazos en 30 días, el tope dice el día en que el más viejo cumple 30', async () => {
    const ana = await person()
    await addRejections(ana.id, 25, 3, 10)

    const sent = await submit(ana.id)
    expect(sent).toMatchObject({ decision: 'capped', retry_on: daysAgo(25 - 30) })
    expect(await countRows('identity_requests', 'user_id', ana.id)).toBe(0)
  })

  // Covers: US3-AS5, FR-027. Un rechazo de hace 30 días ya salió de la ventana.
  it('un rechazo de hace 30 días no cuenta para el tope', async () => {
    const ana = await person()
    await addRejections(ana.id, 30, 3, 10)
    expect((await submit(ana.id)).decision).toBe('sent')
  })

  // Covers: US1-AS6, US3-AS5, FR-012, FR-027
  it('retirar no cuenta como intento', async () => {
    const ana = await person()
    await addRejections(ana.id, 3, 10)
    await openRequest(ana.id)
    expect((await withdraw(ana.id)).decision).toBe('withdrawn')

    expect((await submit(ana.id)).decision).toBe('sent')
  })

  // Covers: US1-AS6, FR-012, FR-012a, SC-002
  it('retirar borra el pedido y sus imágenes, y no deja nada', async () => {
    const ana = await person()
    const id = await openRequest(ana.id)

    const withdrawn = await withdraw(ana.id)
    expect(withdrawn).toMatchObject({ decision: 'withdrawn', request_origin: 'profile' })
    expect(await countRows('identity_requests', 'user_id', ana.id)).toBe(0)
    expect(await imagesOf(id)).toBe(0)
    const left = await Promise.all(
      (['identity_rejections', 'identity_expirations', 'identity_resolutions'] as const).map(
        (table) => countRows(table, 'user_id', ana.id),
      ),
    )
    expect(left).toEqual([0, 0, 0])
  })

  // Covers: FR-012b
  it('sin pedido abierto no hay nada que retirar', async () => {
    const ana = await person()
    expect((await withdraw(ana.id)).decision).toBe('not_open')
  })
})

describeDb('el pedido, lo que no se ve', () => {
  // Covers: FR-011, FR-029, SC-003. La dueña no vuelve a ver sus imágenes después de enviarlas.
  it('la dueña ve su pedido pero no sus imágenes', async () => {
    const ana = await person()
    const id = await openRequest(ana.id)

    const own = await ana.client.from('identity_requests').select('id').eq('user_id', ana.id)
    expect(own.data).toEqual([{ id }])
    const images = await ana.client
      .from('identity_request_images')
      .select('kind')
      .eq('request_id', id)
    expect(images.data ?? []).toEqual([])
  })

  // Covers: FR-013, FR-029, SC-003
  it('otra cuenta y alguien sin sesión no ven el pedido ni las imágenes', async () => {
    const ana = await person()
    const lucia = await person()
    const id = await openRequest(ana.id)

    const reads = await Promise.all(
      [lucia.client, anonClient()].flatMap((client) => [
        client.from('identity_requests').select('*').eq('id', id),
        client.from('identity_request_images').select('*').eq('request_id', id),
      ]),
    )
    for (const read of reads) expect(read.data ?? []).toEqual([])
  })
})

describeDb('el pedido, lo que no se puede', () => {
  // Covers: FR-033, FR-013a. Si la dueña pudiera escribirse la identidad verificada, el nivel 2 no
  // significaría nada; si pudiera borrar sus rechazos, se saltearía el tope; si pudiera escribirse
  // en `admins`, se designaría a sí misma.
  it('nadie inserta en ninguna tabla nueva desde el cliente, tampoco la dueña', async () => {
    const ana = await person()
    const id = await openRequest(ana.id)
    const rows: Record<(typeof NEW_TABLES)[number], Record<string, unknown>> = {
      admins: { user_id: ana.id },
      identity_requests: { user_id: ana.id, expires_at: 'now()', origin: 'profile' },
      identity_request_images: { request_id: id, kind: 'front', data: '\\x00' },
      identity_verifications: { user_id: ana.id, verified_on: '2026-09-26' },
      identity_rejections: { user_id: ana.id, rejected_on: '2026-09-26', reason: 'mismatch' },
      identity_expirations: { user_id: ana.id, expired_on: '2026-09-26' },
      identity_resolutions: { request_id: id, user_id: ana.id, resolved_by: ana.id },
    }

    const attempts = await Promise.all(
      [ana.client, anonClient()].flatMap((client) =>
        NEW_TABLES.map(async (table) => ({
          table,
          error: (await client.from(table).insert(rows[table])).error,
        })),
      ),
    )
    for (const { table, error } of attempts) expect(error, `${table} dejó insertar`).not.toBeNull()
    expect(await countRows('admins', 'user_id', ana.id)).toBe(0)
    expect(await countRows('identity_verifications', 'user_id', ana.id)).toBe(0)
  })

  it('la dueña no cambia ni borra su pedido, sus imágenes ni sus rechazos', async () => {
    const ana = await person()
    await addRejections(ana.id, 2)
    const id = await openRequest(ana.id)

    const moved = await ana.client
      .from('identity_requests')
      .update({ expires_at: '2099-01-01' })
      .eq('id', id)
      .select()
    expect(moved.data ?? []).toEqual([])
    const erased = await ana.client
      .from('identity_rejections')
      .delete()
      .eq('user_id', ana.id)
      .select()
    expect(erased.data ?? []).toEqual([])
    const dropped = await ana.client.from('identity_requests').delete().eq('id', id).select()
    expect(dropped.data ?? []).toEqual([])
    const images = await ana.client
      .from('identity_request_images')
      .delete()
      .eq('request_id', id)
      .select()
    expect(images.data ?? []).toEqual([])

    expect(await countRows('identity_rejections', 'user_id', ana.id)).toBe(1)
    expect(await imagesOf(id)).toBe(2)
  })
})

describeDb('revisar, lo que ve quien administra', () => {
  // Covers: US2-AS1, US2-AS2, FR-013, FR-014, FR-019
  it('quien administra lee la cola, el perfil, los rechazos y las imágenes de un pedido vigente', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    await addRejections(ana.id, 4)
    const id = await openRequest(ana.id)

    const queue = await lucia.client.from('identity_requests').select('id').eq('id', id)
    expect(queue.data).toEqual([{ id }])
    const profile = await lucia.client.from('profiles').select('display_name').eq('id', ana.id)
    expect(profile.data).toHaveLength(1)
    const rejections = await lucia.client
      .from('identity_rejections')
      .select('reason')
      .eq('user_id', ana.id)
    expect(rejections.data).toEqual([{ reason: 'unreadable' }])
    const images = await lucia.client
      .from('identity_request_images')
      .select('kind')
      .eq('request_id', id)
      .order('kind')
    expect(images.data).toEqual([{ kind: 'front' }, { kind: 'selfie' }])
  })

  // Covers: FR-014. Sin un pedido vigente, la cuenta es como cualquier otra para quien administra.
  it('sin pedido vigente, quien administra no lee el perfil ni los rechazos de la cuenta', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    await addRejections(ana.id, 4)

    const profile = await lucia.client.from('profiles').select('*').eq('id', ana.id)
    expect(profile.data).toEqual([])
    const rejections = await lucia.client
      .from('identity_rejections')
      .select('*')
      .eq('user_id', ana.id)
    expect(rejections.data).toEqual([])
  })

  // Covers: US2-AS8, FR-020. Su propio pedido lo ve en la cola, pero sin imágenes.
  it('quien administra no ve las imágenes de su propio pedido', async () => {
    const lucia = await person({ admin: true })
    const id = await openRequest(lucia.id)

    const queue = await lucia.client.from('identity_requests').select('id').eq('id', id)
    expect(queue.data).toEqual([{ id }])
    const images = await lucia.client
      .from('identity_request_images')
      .select('kind')
      .eq('request_id', id)
    expect(images.data).toEqual([])
  })

  // Covers: US3-AS3, FR-019, FR-028. Vencido, no se ve aunque la tarea no lo haya borrado.
  it('quien administra no ve el pedido, las imágenes ni el perfil de uno vencido', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    const id = await openRequest(ana.id)
    await makeExpired(id)

    const queue = await lucia.client.from('identity_requests').select('id').eq('id', id)
    expect(queue.data).toEqual([])
    const images = await lucia.client
      .from('identity_request_images')
      .select('kind')
      .eq('request_id', id)
    expect(images.data).toEqual([])
    const profile = await lucia.client.from('profiles').select('*').eq('id', ana.id)
    expect(profile.data).toEqual([])
  })

  // Covers: FR-013, FR-013a, FR-032, SC-003
  it('nadie más lee quién administra, la cola ni las resoluciones', async () => {
    const ana = await person()
    const marta = await person()
    const lucia = await person({ admin: true })
    const id = await openRequest(ana.id)
    await resolve(id, lucia.id, 'reject', 'mismatch')
    await openRequest(marta.id)

    const reads = await Promise.all(
      [ana.client, marta.client, anonClient()].flatMap((client) => [
        client.from('admins').select('*').eq('user_id', lucia.id),
        client.from('identity_resolutions').select('*'),
        client.from('identity_request_images').select('*'),
      ]),
    )
    for (const read of reads) expect(read.data ?? []).toEqual([])
    const others = await ana.client.from('identity_requests').select('user_id')
    expect(others.data).toEqual([])
    const anon = await anonClient().from('identity_requests').select('*')
    expect(anon.data ?? []).toEqual([])
  })

  // Covers: FR-022b. Dejar de administrar corta el acceso en la consulta siguiente.
  it('quien sale de admins deja de leer la cola y de resolver en ese momento', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    const id = await openRequest(ana.id)
    const before = await lucia.client.from('identity_requests').select('id').eq('id', id)
    expect(before.data).toHaveLength(1)

    await db().from('admins').delete().eq('user_id', lucia.id)

    const after = await lucia.client.from('identity_requests').select('id').eq('id', id)
    expect(after.data).toEqual([])
    const images = await lucia.client
      .from('identity_request_images')
      .select('kind')
      .eq('request_id', id)
    expect(images.data).toEqual([])
    expect((await resolve(id, lucia.id)).decision).toBe('not_admin')
    expect(await imagesOf(id)).toBe(2)
  })
})

describeDb('resolver un pedido', () => {
  // Covers: US2-AS3, US2-AS4, FR-018, SC-002
  it('aprobar borra el pedido y sus imágenes, y deja la verificación y quién resolvió', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    const id = await openRequest(ana.id)

    const resolved = await resolve(id, lucia.id)
    expect(resolved).toMatchObject({
      decision: 'approved',
      owner_id: ana.id,
      request_origin: 'profile',
      resolved_on: daysAgo(0),
      level_one: true,
    })
    expect(await countRows('identity_requests', 'user_id', ana.id)).toBe(0)
    expect(await imagesOf(id)).toBe(0)
    expect(await countRows('identity_verifications', 'user_id', ana.id)).toBe(1)
    const resolution = await db()
      .from('identity_resolutions')
      .select('user_id, resolved_by')
      .eq('request_id', id)
    expect(resolution.data).toEqual([{ user_id: ana.id, resolved_by: lucia.id }])
  })

  // Covers: US2-AS5, US3-AS1, FR-018, FR-027
  it('rechazar deja el día y el motivo, y quién resolvió; el tercero trae el día del tope', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    await addRejections(ana.id, 3, 5)
    const id = await openRequest(ana.id)

    const resolved = await resolve(id, lucia.id, 'reject', 'expired_document')
    expect(resolved).toMatchObject({
      decision: 'rejected',
      rejections_in_window: 3,
      retry_on: daysAgo(5 - 30),
    })
    expect(await imagesOf(id)).toBe(0)
    const rejection = await db()
      .from('identity_rejections')
      .select('reason, rejected_on')
      .eq('user_id', ana.id)
      .eq('reason', 'expired_document')
    expect(rejection.data).toEqual([{ reason: 'expired_document', rejected_on: daysAgo(0) }])
    expect(await countRows('identity_resolutions', 'request_id', id)).toBe(1)
    expect(await countRows('identity_verifications', 'user_id', ana.id)).toBe(0)
  })

  // Covers: FR-016. Rechazar sin motivo, o aprobar con uno, no existe.
  it('rechazar sin motivo o aprobar con motivo falla sin cambiar nada', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    const id = await openRequest(ana.id)
    const call = (outcome: string, reason?: string) =>
      db().rpc('resolve_identity_request', {
        p_request_id: id,
        p_admin: lucia.id,
        p_outcome: outcome,
        p_window_days: 30,
        p_cap: 3,
        p_pending_ttl: '7 days',
        ...(reason === undefined ? {} : { p_reason: reason }),
      })

    const failures = await Promise.all([call('reject'), call('approve', 'mismatch'), call('maybe')])
    for (const failure of failures) expect(failure.error).not.toBeNull()
    expect(await imagesOf(id)).toBe(2)
  })

  // Covers: US2-AS8, FR-020, FR-028, SC-004
  it('sin estar en admins, el propio y uno vencido no se resuelven', async () => {
    const ana = await person()
    const marta = await person()
    const lucia = await person({ admin: true })
    const anaRequest = await openRequest(ana.id)
    const own = await openRequest(lucia.id)
    const martaRequest = await openRequest(marta.id)
    await makeExpired(martaRequest)

    expect((await resolve(anaRequest, marta.id)).decision).toBe('not_admin')
    expect((await resolve(own, lucia.id)).decision).toBe('own_request')
    expect((await resolve(martaRequest, lucia.id)).decision).toBe('expired')
    expect((await resolve(crypto.randomUUID(), lucia.id)).decision).toBe('gone')

    const images = await Promise.all([anaRequest, own, martaRequest].map(imagesOf))
    expect(images).toEqual([2, 2, 2])
    expect(await countRows('identity_verifications', 'user_id', ana.id)).toBe(0)
  })

  // Covers: US2-AS6, FR-022, SC-004
  it('dos resoluciones en paralelo: vale una, y la otra no encuentra el pedido', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    const sofia = await person({ admin: true })
    const id = await openRequest(ana.id)

    const outcomes = await Promise.all([
      resolve(id, lucia.id),
      resolve(id, sofia.id, 'reject', 'unreadable'),
    ])
    expect(outcomes.filter((outcome) => outcome.decision === 'gone')).toHaveLength(1)
    expect(await countRows('identity_resolutions', 'request_id', id)).toBe(1)
    const verified = await countRows('identity_verifications', 'user_id', ana.id)
    const rejected = await countRows('identity_rejections', 'user_id', ana.id)
    expect(verified + rejected).toBe(1)
  })

  // Covers: Edge Cases «Retira mientras se resuelve», FR-012b
  it('un retiro y una resolución en paralelo: vale uno solo', async () => {
    const ana = await person()
    const lucia = await person({ admin: true })
    const id = await openRequest(ana.id)

    const [withdrawn, resolved] = await Promise.all([withdraw(ana.id), resolve(id, lucia.id)])
    const withdrew = withdrawn.decision === 'withdrawn'
    expect(withdrew).toBe(resolved.decision === 'gone')
    expect(withdrawn.decision).toBe(withdrew ? 'withdrawn' : 'not_open')
    expect(await countRows('identity_verifications', 'user_id', ana.id)).toBe(withdrew ? 0 : 1)
    expect(await imagesOf(id)).toBe(0)
  })
})
