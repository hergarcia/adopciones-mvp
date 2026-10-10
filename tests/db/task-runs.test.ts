// Las vueltas de las tareas solas (historia #169, US5): nadie de afuera las lee ni las escribe, el aviso
// de una tarea atrasada sale una vez por día, y los trabajos de la base son los que la vigilancia
// espera, cada uno anotando su vuelta con su nombre.
import { afterEach, expect, it } from 'vitest'
import { TASKS } from '../../src/lib/cron/tasks'
import { DB_RULES } from '../../src/lib/verification/rules'
import { describeDb } from '../setup/env-report'
import { sql } from './listing-support'
import { db } from './phone-support'
import { anonClient, asNewUser, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await sql(`delete from private.task_alerts where task like 'prueba-%'`)
  await sql(`delete from private.task_runs where task like 'prueba-%'`)
})

const someTask = () => `prueba-${crypto.randomUUID()}`

async function lastOkOf(task: string): Promise<number> {
  const { data, error } = await db().rpc('list_task_runs')
  expect(error).toBeNull()
  const run = (data ?? []).find((row) => row.task === task)
  if (run === undefined) throw new Error(`la tarea ${task} no tiene vuelta`)
  return Date.parse(run.last_ok_at)
}

describeDb('las vueltas de las tareas, para cualquier sesión', () => {
  // Covers: FR-061, data-model §Pruebas de base. Las vueltas no dicen nada de nadie, pero con ellas
  // cualquiera callaría a la vigilancia o la haría avisar de más.
  it('ni sin sesión ni con sesión se anota, se lee ni se reclama nada, ni se dispara una tarea', async () => {
    const person = await asNewUser()
    cleanups.push(person.cleanup)
    for (const client of [anonClient(), person.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const calls = await Promise.all([
        client.rpc('record_task_run', { p_task: 'pet-lifecycle' }),
        client.rpc('list_task_runs'),
        client.rpc('claim_task_alert', { p_task: 'pet-lifecycle' }),
        client.rpc('daily_cleanup_tick'),
        client.rpc('task_watch_tick'),
        client.rpc('claim_identity_expiry_notices'),
      ])
      expect(calls.map(({ error }) => error?.code)).toEqual(Array(6).fill('42501'))
    }
  })

  it('las tablas de las vueltas no tienen permisos para ningún rol de la API, y su RLS está prendida', async () => {
    const grants = await sql<{ role: string; tbl: string; can: boolean }>(`
      select r.role, t.tbl,
             has_table_privilege(r.role, t.tbl, 'select, insert, update, delete') as can
        from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
       cross join unnest(array['private.task_runs', 'private.task_alerts']) as t(tbl)`)
    expect(grants).toHaveLength(6)
    expect(grants.filter((grant) => grant.can)).toEqual([])

    const rls = await sql<{ relname: string; relrowsecurity: boolean }>(`
      select relname, relrowsecurity from pg_class
       where oid in ('private.task_runs'::regclass, 'private.task_alerts'::regclass)`)
    expect(rls.map((table) => table.relrowsecurity)).toEqual([true, true])

    const viaApi = await anonClient().schema('private').from('task_runs').select('*')
    expect(viaApi.data).toBeNull()
    expect(viaApi.error).not.toBeNull()
  })
})

describeDb('el aviso de una tarea atrasada', () => {
  // Covers: FR-043. La base y Vercel llaman a la vigilancia por separado: las dos a la vez no avisan
  // dos veces.
  it('se reclama una sola vez por día, también con dos vigilancias a la vez', async () => {
    const task = someTask()
    const claims = await Promise.all([
      db().rpc('claim_task_alert', { p_task: task }),
      db().rpc('claim_task_alert', { p_task: task }),
    ])
    expect(claims.map(({ error }) => error)).toEqual([null, null])
    expect(claims.filter(({ data }) => data === true)).toHaveLength(1)
    expect(claims.filter(({ data }) => data === false)).toHaveLength(1)

    const again = await db().rpc('claim_task_alert', { p_task: task })
    expect(again).toMatchObject({ data: false, error: null })
  })

  // Covers: FR-040. Una vuelta que terminó mueve la última vuelta hacia adelante.
  it('anotar una vuelta mueve su hora hacia adelante', async () => {
    const task = someTask()
    expect((await db().rpc('record_task_run', { p_task: task })).error).toBeNull()
    const first = await lastOkOf(task)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect((await db().rpc('record_task_run', { p_task: task })).error).toBeNull()

    expect(await lastOkOf(task)).toBeGreaterThan(first)
  })
})

describeDb('los trabajos de la base', () => {
  // Covers: FR-040, FR-041. La vigilancia avisa de una tarea de la lista sin vuelta: un trabajo que
  // falta o que anota otro nombre sería un aviso todos los días, y uno que sobra, una tarea sin vigilar.
  it('son las tareas de la lista que corren en la base, más la vigilancia', async () => {
    const jobs = await sql<{ jobname: string; command: string }>(
      'select jobname, command from cron.job',
    )
    const expected = [
      ...TASKS.map(({ name }) => name).filter((task) => task !== 'vigilancia-diaria'),
      'task-watch',
    ]
    expect(jobs).toHaveLength(expected.length)
    expect(new Set(jobs.map((job) => job.jobname))).toEqual(new Set(expected))

    // La limpieza la anota la ruta al terminar; la vigilancia no es una tarea vigilada.
    const recordedInDb = jobs.filter(
      (job) => !['daily-cleanup', 'task-watch'].includes(job.jobname),
    )
    for (const job of recordedInDb) {
      expect(job.command).toMatch(
        new RegExp(`select private\\.task_ran\\('${job.jobname}'\\)$`, 'u'),
      )
    }
  })

  // Covers: FR-041, KL-016. Los plazos de #10 escritos en el comando: si la regla cambia y el SQL no,
  // la limpieza diaria borraría con otros plazos que los de la aplicación.
  it('la limpieza de los datos del teléfono usa los plazos de #10', async () => {
    const [job] = await sql<{ command: string }>(
      `select command from cron.job where jobname = 'phone-records-purge'`,
    )
    expect(job?.command).toContain(
      `public.purge_phone_records('${DB_RULES.p_window}', '${DB_RULES.p_pending_ttl}')`,
    )
  })
})
