// Las vueltas de las tareas solas (historia #169, US5): nadie de afuera las lee ni las escribe, el aviso
// de una tarea atrasada sale una vez por día, los trabajos de la base son los que la vigilancia
// espera, cada uno anotando su vuelta con su nombre, y la vigilancia ve la llamada a la aplicación
// que no salió bien. Este archivo no corre contra la nube (scripts/cloud/privacy-check.mjs): toca
// filas que no son de sus personas de prueba.
import { afterEach, expect, it } from 'vitest'
import { TASKS } from '../../src/lib/cron/tasks'
import { DB_RULES } from '../../src/lib/verification/rules'
import { describeDb } from '../setup/env-report'
import { dayOf, expireAll, makeExpired, openRequest, people } from './identity-support'
import { sql } from './listing-support'
import { db } from './phone-support'
import { anonClient, asNewUser, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const newPerson = people(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
  await sql(`delete from private.task_alerts where task like 'prueba-%'`)
  await sql(`delete from private.task_runs where task like 'prueba-%'`)
  await sql(`delete from private.task_calls where task like 'prueba-%'`)
  await sql('delete from net._http_response where id < 0')
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
        client.rpc('list_failed_task_calls'),
        client.rpc('claim_identity_expiry_notices'),
      ])
      expect(calls.map(({ error }) => error?.code)).toEqual(Array(7).fill('42501'))
    }
  })

  it('las tablas de las vueltas no tienen permisos para ningún rol de la API, y su RLS está prendida', async () => {
    const grants = await sql<{ role: string; tbl: string; can: boolean }>(`
      select r.role, t.tbl,
             has_table_privilege(r.role, t.tbl, 'select, insert, update, delete') as can
        from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
       cross join unnest(array['private.task_runs', 'private.task_alerts', 'private.task_calls']) as t(tbl)`)
    expect(grants).toHaveLength(9)
    expect(grants.filter((grant) => grant.can)).toEqual([])

    const rls = await sql<{ relname: string; relrowsecurity: boolean }>(`
      select relname, relrowsecurity from pg_class
       where oid in ('private.task_runs'::regclass, 'private.task_alerts'::regclass,
                     'private.task_calls'::regclass)`)
    expect(rls.map((table) => table.relrowsecurity)).toEqual([true, true, true])

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

// Corre la función adentro de un bloque que termina siempre con error: la base deshace todo, el
// pedido a la aplicación incluido, y el mensaje del error dice lo que pasó adentro.
async function inRolledBack(body: string): Promise<string> {
  try {
    await sql(`do $$ begin ${body} end $$`)
  } catch (error) {
    return String(error)
  }
  throw new Error('el bloque no terminó con error')
}

describeDb('las llamadas de las tareas a la aplicación', () => {
  // Covers: FR-043, US5-AS3. La base no espera la respuesta: sin saber de qué tarea es cada pedido,
  // la vigilancia no puede decir cuál no hizo su trabajo.
  it('la tarea que llama a la aplicación anota de quién es el pedido', async () => {
    const message = await inRolledBack(`
      perform public.admin_digest_tick();
      perform public.daily_cleanup_tick();
      raise exception 'anotadas: %', (
        select string_agg(c.task, ',' order by c.task) from private.task_calls c
         where c.called_at = now()
      );`)
    expect(message).toContain('anotadas: admin-digest,daily-cleanup')
  })

  // Covers: FR-043. Una tarea que volviera sin hacer nada dejaría que su trabajo anote la vuelta: con
  // los secretos borrados, todas las que llaman a la aplicación quedarían al día sin trabajar.
  it.each(['app_url', 'cron_secret'])(
    'sin %s en Vault, la tarea falla y su vuelta no se anota',
    async (secret) => {
      const message = await inRolledBack(`
        delete from vault.secrets where name = '${secret}';
        perform public.admin_digest_tick();
        raise exception 'siguió sin el secreto';`)
      expect(message).toContain('Faltan app_url o cron_secret en Vault')
    },
  )

  // Covers: FR-043, US5-AS3. Un 401 por un secreto que no coincide, un 5xx o una aplicación que no
  // contesta: el trabajo no se hizo aunque la vuelta se haya anotado.
  it('la vigilancia lee la última llamada fallida de cada tarea, y no las que salieron bien o esperan', async () => {
    const [rejected, ok, unreachable, waiting, recovered] = Array.from({ length: 5 }, someTask)
    await sql(`
      insert into private.task_calls (request_id, task, called_at) values
        (-1, '${rejected}', now() - interval '30 minutes'),
        (-2, '${rejected}', now() - interval '10 minutes'),
        (-3, '${ok}', now() - interval '10 minutes'),
        (-4, '${unreachable}', now() - interval '10 minutes'),
        (-5, '${waiting}', now() - interval '10 minutes'),
        (-6, '${recovered}', now() - interval '20 minutes'),
        (-7, '${recovered}', now() - interval '5 minutes');
      insert into net._http_response (id, status_code, error_msg) values
        (-1, 401, null), (-2, 503, null), (-3, 204, null),
        (-4, null, 'Couldn''t connect to server'), (-6, 500, null), (-7, 200, null);`)

    const { data, error } = await db().rpc('list_failed_task_calls')
    expect(error).toBeNull()
    const ours = (data ?? [])
      .filter((call) => call.task.startsWith('prueba-'))
      .map(({ task, status_code }) => ({ task, status_code }))
    expect(ours).toEqual(
      expect.arrayContaining([
        { task: rejected, status_code: 503 },
        { task: unreachable, status_code: null },
        { task: recovered, status_code: 500 },
      ]),
    )
    expect(ours).toHaveLength(3)
  })
})

describeDb('el correo de vencimiento de identidad', () => {
  // Covers: #169 FR-042, spec §Edge Cases «Dos vueltas a la vez». El aviso se marca al tomarlo:
  // dos vueltas a la vez no mandan el mismo correo dos veces, y uno que no salió no se reintenta.
  // Toma los avisos de todas las personas: por eso vive acá y no en identity.test.ts, que corre
  // contra la nube.
  it('dos vueltas a la vez toman el aviso de vencimiento una sola vez, con su origen', async () => {
    const ana = await newPerson()
    const expiredAt = await makeExpired(await openRequest(ana.id))
    await expireAll()

    const claim = async () => {
      const { data, error } = await db().rpc('claim_identity_expiry_notices')
      expect(error).toBeNull()
      return (data ?? []).filter((notice) => notice.user_id === ana.id)
    }
    const claims = await Promise.all([claim(), claim()])

    expect(claims.flat()).toEqual([
      { user_id: ana.id, expired_on: dayOf(expiredAt), notice_origin: 'profile' },
    ])
    expect(await claim()).toEqual([])
    const left = await db()
      .from('identity_expirations')
      .select('notice_pending, notice_origin')
      .eq('user_id', ana.id)
    expect(left.data).toEqual([{ notice_pending: false, notice_origin: null }])
  })
})
