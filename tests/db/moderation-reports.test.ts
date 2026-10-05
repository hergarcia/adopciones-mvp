// Reportar y cerrar (historia #13, US1): un reporte se guarda una vez por motivo mientras está sin
// resolver; solo quien administra lo lee y lo cierra, nunca uno sobre sí, una sola vez; y lo que no
// debe verse —el reporte para la reportada, para cualquier otra persona y sin sesión— se demuestra
// con un intento que falla.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  block,
  close,
  countsOf,
  lift,
  moderationPeople,
  queueOf,
  readAs,
  report,
  reportsAbout,
  suspend,
} from './moderation-support'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const people = moderationPeople(cleanups)
const { person, admin } = people

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function deleteAccount(userId: string) {
  const { error } = await serviceClient().auth.admin.deleteUser(userId)
  expect(error).toBeNull()
}

describeDb('reportar a una persona', () => {
  it('guarda el reporte con quién, a quién, el motivo y el texto', async () => {
    const [marta, ana] = [await person(1), await person(1)]

    expect(await report(marta, ana, 'sells_animals', '  Me ofreció un cachorro  ')).toEqual({
      outcome: 'created',
      blocked_already: false,
    })
    const [row] = await reportsAbout(ana.id)
    expect(row).toMatchObject({
      reporter_id: marta.id,
      reported_id: ana.id,
      reason: 'sells_animals',
      details: 'Me ofreció un cachorro',
      resolved_at: null,
      resolution: null,
    })
  })

  it('el mismo motivo sin resolver no suma otro; otro motivo sí (FR-004)', async () => {
    const [marta, ana] = [await person(1), await person(1)]

    await report(marta, ana, 'scam')
    expect((await report(marta, ana, 'scam', 'De nuevo')).outcome).toBe('duplicate')
    expect((await report(marta, ana, 'harassment')).outcome).toBe('created')
    expect((await reportsAbout(ana.id)).map((row) => row.reason)).toEqual(['scam', 'harassment'])
  })

  it('cerrado el anterior, se puede reportar de nuevo por el mismo motivo', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await report(marta, ana, 'scam')
    const [first] = await reportsAbout(ana.id)
    expect((await close(lucia.client, first?.id ?? '')).decision).toBe('done')

    expect((await report(marta, ana, 'scam')).outcome).toBe('created')
    expect(await reportsAbout(ana.id)).toHaveLength(2)
  })

  it('NO se reporta a sí misma', async () => {
    const ana = await person(1)
    expect((await report(ana, ana)).outcome).toBe('self')
    expect(await reportsAbout(ana.id)).toEqual([])
  })

  it('una cuenta que no existe es not_found y no guarda nada', async () => {
    const marta = await person(1)
    const { data, error } = await db().rpc('create_report', {
      p_reporter: marta.id,
      p_reported_public_id: 'AbCdEfGhIjKlMnOpQrStUv',
      p_reason: 'scam',
    })
    expect(error).toBeNull()
    expect(data).toEqual([{ outcome: 'not_found', blocked_already: false }])
  })

  it('a una suspendida no se la reporta, salvo quien la bloqueó (FR-002)', async () => {
    const [marta, beto, ana] = [await person(1), await person(1), await person(1)]
    await suspend(ana.id)
    await block(beto.id, ana.id)

    expect(await report(marta, ana)).toEqual({ outcome: 'not_found', blocked_already: false })
    expect(await report(beto, ana)).toEqual({ outcome: 'created', blocked_already: true })
    expect((await reportsAbout(ana.id)).map((row) => row.reporter_id)).toEqual([beto.id])
  })

  it('dice si quien reporta ya la había bloqueado, para no ofrecer bloquearla', async () => {
    const [marta, ana] = [await person(1), await person(1)]
    await block(marta.id, ana.id)
    expect(await report(marta, ana)).toEqual({ outcome: 'created', blocked_already: true })
  })

  it('«otro» sin texto no se guarda: la base lo rechaza aunque la acción no lo frene', async () => {
    const [marta, ana] = [await person(1), await person(1)]
    const calls = await Promise.all(
      [{}, { p_details: '   ' }].map((details) =>
        db().rpc('create_report', {
          p_reporter: marta.id,
          p_reported_public_id: ana.publicId,
          p_reason: 'other',
          ...details,
        }),
      ),
    )
    expect(calls.map(({ error }) => error?.code)).toEqual(['23514', '23514'])
    expect(await reportsAbout(ana.id)).toEqual([])
  })
})

describeDb('la lista de reportes', () => {
  it('trae los sin resolver del más viejo al más nuevo, con quién y sobre quién', async () => {
    const [marta, beto, ana, lucia] = [
      await person(1, 'Marta'),
      await person(1, 'Beto'),
      await person(1, 'Ana'),
      await admin('Lucía'),
    ]
    await report(beto, ana, 'harassment', 'Me escribe todos los días')
    await report(marta, ana, 'sells_animals')

    const rows = (await queueOf(lucia.client)).filter(
      (row) => row.reported_public_id === ana.publicId,
    )
    expect(rows.map((row) => [row.reporter_name, row.reason, row.details])).toEqual([
      ['Beto', 'harassment', 'Me escribe todos los días'],
      ['Marta', 'sells_animals', null],
    ])
    expect(rows[0]).toMatchObject({
      reporter_public_id: beto.publicId,
      reporter_suspended: false,
      reported_name: 'Ana',
      reported_suspended: false,
      history: [],
    })
  })

  it('cada reporte trae el historial: reportes cerrados y suspensiones, con quién', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1, 'Ana'), await admin('Lucía')]
    await report(marta, ana, 'scam', 'Pidió plata')
    const [first] = await reportsAbout(ana.id)
    await close(lucia.client, first?.id ?? '')
    await lift(await suspend(ana.id, lucia.id))
    await report(marta, ana, 'scam')

    const [row] = (await queueOf(lucia.client)).filter(
      (candidate) => candidate.reported_public_id === ana.publicId,
    )
    expect(row?.history).toHaveLength(2)
    expect(row?.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'report',
          reason: 'scam',
          details: 'Pidió plata',
          resolution: 'dismissed',
        }),
        expect.objectContaining({
          kind: 'suspension',
          reason: 'Motivo de prueba',
          suspended_by: 'Lucía',
        }),
      ]),
    )
  })

  it('marca a quien reportó si su cuenta está suspendida, y a la reportada si lo está', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await block(marta.id, ana.id)
    await report(marta, ana)
    await suspend(marta.id)
    await suspend(ana.id)

    const [row] = (await queueOf(lucia.client)).filter(
      (candidate) => candidate.reported_public_id === ana.publicId,
    )
    expect(row).toMatchObject({ reporter_suspended: true, reported_suspended: true })
  })

  it('quien reportó y borró su cuenta queda como «una cuenta borrada»', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await report(marta, ana)
    await deleteAccount(marta.id)

    const [stored] = await reportsAbout(ana.id)
    expect(stored?.reporter_id).toBeNull()
    const [row] = (await queueOf(lucia.client)).filter(
      (candidate) => candidate.reported_public_id === ana.publicId,
    )
    expect(row).toMatchObject({ reporter_name: null, reporter_public_id: null })
  })

  it('borrar a la reportada borra sus reportes y los saca de la lista', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await report(marta, ana)
    await deleteAccount(ana.id)

    expect(await reportsAbout(ana.id)).toEqual([])
    expect(
      (await queueOf(lucia.client)).filter((row) => row.reported_public_id === ana.publicId),
    ).toEqual([])
  })

  it('quien administra y fue reportada ve solo cuántos, sin nada más (FR-010)', async () => {
    const [marta, lucia, otra] = [await person(1), await admin('Lucía'), await admin('Otra')]
    const before = await countsOf(lucia.client)
    await report(marta, lucia, 'harassment', 'Algo privado')

    expect(
      (await queueOf(lucia.client)).filter((row) => row.reported_public_id === lucia.publicId),
    ).toEqual([])
    expect(await countsOf(lucia.client)).toEqual({ ...before, own: before.own + 1 })
    // La otra persona que administra sí lo ve y lo cuenta.
    expect(
      (await queueOf(otra.client)).filter((row) => row.reported_public_id === lucia.publicId),
    ).toHaveLength(1)
  })

  it('cuenta los que esperan a quien mira, sin los propios', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    const before = await countsOf(lucia.client)
    await report(marta, ana, 'scam')
    await report(marta, ana, 'harassment')
    expect(await countsOf(lucia.client)).toEqual({ ...before, others: before.others + 2 })
  })

  it('NO hay lista ni cuenta para quien no administra, ni para una suspendida que administra', async () => {
    const [marta, ana, beto, lucia] = [
      await person(1),
      await person(1),
      await person(1),
      await admin(),
    ]
    await report(marta, ana)
    await suspend(lucia.id)

    const clients = [beto.client, ana.client, lucia.client]
    expect(await Promise.all(clients.map(queueOf))).toEqual([[], [], []])
    expect(await Promise.all(clients.map(countsOf))).toEqual(
      clients.map(() => ({ others: 0, own: 0 })),
    )
    expect((await anonClient().rpc('report_queue')).error).not.toBeNull()
  })
})

describeDb('cerrar sin medidas', () => {
  it('cierra, deja quién y cuándo, y sale de la lista', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await report(marta, ana)
    const [open] = await reportsAbout(ana.id)

    const closed = await close(lucia.client, open?.id ?? '')
    expect(closed).toMatchObject({ decision: 'done', resolution: 'dismissed' })
    expect(closed.created_at).toBe(open?.created_at)
    const [row] = await reportsAbout(ana.id)
    expect(row).toMatchObject({ resolution: 'dismissed', resolved_by: lucia.id })
    expect(row?.resolved_at).not.toBeNull()
    expect(
      (await queueOf(lucia.client)).filter((candidate) => candidate.report_id === open?.id),
    ).toEqual([])
  })

  it('la segunda persona que administra ve que ya se cerró, cómo y por quién (FR-011)', async () => {
    const [marta, ana, lucia, otra] = [
      await person(1),
      await person(1),
      await admin('Lucía'),
      await admin('Otra'),
    ]
    await report(marta, ana)
    const [open] = await reportsAbout(ana.id)
    await close(lucia.client, open?.id ?? '')

    expect(await close(otra.client, open?.id ?? '')).toMatchObject({
      decision: 'closed',
      resolution: 'dismissed',
      resolved_by_name: 'Lucía',
    })
    const [row] = await reportsAbout(ana.id)
    expect(row?.resolved_by).toBe(lucia.id)
  })

  it('NO cierra un reporte sobre sí misma', async () => {
    const [marta, lucia] = [await person(1), await admin()]
    await report(marta, lucia)
    const [open] = await reportsAbout(lucia.id)

    expect((await close(lucia.client, open?.id ?? '')).decision).toBe('own')
    expect((await reportsAbout(lucia.id))[0]?.resolved_at).toBeNull()
  })

  it('si la cuenta reportada se borró, dice que ya no existe (FR-032)', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await report(marta, ana)
    const [open] = await reportsAbout(ana.id)
    await deleteAccount(ana.id)

    expect((await close(lucia.client, open?.id ?? '')).decision).toBe('gone')
  })

  it('NO cierra quien no administra, ni quien administra y está suspendida', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await report(marta, ana)
    const [open] = await reportsAbout(ana.id)
    await suspend(lucia.id)

    const closed = await Promise.all(
      [marta.client, ana.client, lucia.client].map((client) => close(client, open?.id ?? '')),
    )
    expect(closed.map(({ decision }) => decision)).toEqual(['not_admin', 'not_admin', 'not_admin'])
    expect(
      (await anonClient().rpc('close_report', { p_report: open?.id ?? '' })).error,
    ).not.toBeNull()
    expect((await reportsAbout(ana.id))[0]?.resolved_at).toBeNull()
  })
})

describeDb('quién lee los reportes', () => {
  it('quien administra lee la tabla', async () => {
    const [marta, ana, lucia] = [await person(1), await person(1), await admin()]
    await report(marta, ana)
    const { rows, error } = await readAs(lucia.client, 'reports')
    expect(error).toBeNull()
    expect(rows.filter((row) => row.reported_id === ana.id)).toHaveLength(1)
  })

  it('NO la lee la reportada, ni quien reportó, ni otra persona, ni sin sesión', async () => {
    const [marta, ana, beto] = [await person(1), await person(1), await person(1)]
    await report(marta, ana)

    const reads = await Promise.all(
      [ana.client, marta.client, beto.client].map((client) => readAs(client, 'reports')),
    )
    expect(reads).toEqual(reads.map(() => ({ rows: [], error: null })))
    expect((await readAs(anonClient(), 'reports')).rows).toEqual([])
  })

  it('quien administra y fue reportada NO lee esos reportes ni leyendo la tabla con su token', async () => {
    const [marta, lucia] = [await person(1), await admin()]
    await report(marta, lucia)
    const { rows } = await readAs(lucia.client, 'reports')
    expect(rows.filter((row) => row.reported_id === lucia.id)).toEqual([])
  })

  it('NO lee las suspensiones la suspendida, otra persona, una suspendida que administra ni sin sesión', async () => {
    const [ana, beto, lucia, otra] = [
      await person(1),
      await person(1),
      await admin(),
      await admin(),
    ]
    await suspend(ana.id)
    await suspend(otra.id)

    const reads = await Promise.all(
      [ana.client, beto.client, otra.client].map((client) => readAs(client, 'account_suspensions')),
    )
    expect(
      reads.map(({ rows }) =>
        rows.filter((row) => row.user_id === ana.id || row.user_id === otra.id),
      ),
    ).toEqual([[], [], []])
    expect((await readAs(anonClient(), 'account_suspensions')).rows).toEqual([])
    const { rows } = await readAs(lucia.client, 'account_suspensions')
    expect(rows.filter((row) => row.user_id === ana.id)).toHaveLength(1)
  })

  it('la suspendida lee su situación, y solo la suya', async () => {
    const [ana, beto] = [await person(1), await person(1)]
    await suspend(ana.id)

    const mine = await ana.client.rpc('my_account_standing')
    expect(mine.data).toEqual([{ reason: 'Motivo de prueba', since: expect.any(String) }])
    expect((await beto.client.rpc('my_account_standing')).data).toEqual([])
  })
})
