// La corrida de las 8 de los avisos (historia #265, US2, research R2, R3): qué le devuelve a cada
// persona, qué deja afuera y cuándo cierra el período. Si se rompe, a Bruno le llega un animal pausado,
// uno de alguien que lo bloqueó, el mismo dos veces, o nada después de un correo que no salió.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { changed, setState } from './lifecycle-support'
import { listLitter, youngList, youngOf } from './litter-support'
import { listPet, publishers } from './listing-support'
import { block, lift, moderationPeople, suspend } from './moderation-support'
import {
  alertFor,
  alertsOf,
  claimMail,
  mailOf,
  markMailed,
  nextDay,
  sendsOf,
  stampFirstListed,
  type MailRow,
} from './pet-alerts-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = moderationPeople(cleanups)
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

// Treinta y Tres: el aviso de Bruno mira solo ahí, así lo de otras pruebas no se cruza.
const ZONE = { department: 'UY-TT', locality: 'Vergara' }
const IN_ZONE = { department: ['UY-TT' as const] }

const sorted = (codes: string[]) => codes.toSorted((a, b) => a.localeCompare(b))
const codesOf = (rows: MailRow[]) => sorted(rows.map((row) => row.code))
const time = (value: string | null | undefined) => new Date(String(value)).getTime()

async function brunoWithAlert() {
  const bruno = await person(1, 'Bruno')
  await alertFor(bruno.client, IN_ZONE)
  return bruno
}

async function petIn(ownerId: string, name = 'Tobi') {
  return listPet(ownerId, { fields: { ...ZONE, name } })
}

/** Lo que la corrida devolvió para Bruno, después de correrla. */
async function claimFor(userId: string) {
  return mailOf(await claimMail(), userId)
}

async function coveredOf(userId: string) {
  return (await alertsOf(userId)).map((alert) => alert.covered_until)
}

describeDb('lo nuevo de cada aviso (R3)', () => {
  // Covers: US2-AS1, US2-AS9, FR-014, FR-018 (la base de la parte: el aviso, el animal y la camada
  // como uno, con lo que el correo necesita, en el orden de los avisos)
  it('trae lo publicado después del aviso, la camada una sola vez, aviso por aviso', async () => {
    const bruno = await brunoWithAlert()
    await alertFor(bruno.client, { ...IN_ZONE, species: ['dog'] })
    const carla = await publisher()
    const rita = await publisher()
    const tobi = await petIn(carla.id)
    const litter = await listLitter(rita.id, new Date().toISOString(), youngList(3), ZONE)
    const young = (await youngOf(litter.litterId)).map((one) => one.code)

    const rows = await claimFor(bruno.id)

    const [first, second] = await alertsOf(bruno.id)
    // Los avisos en el orden en que se crearon; adentro de cada uno, sin cortar ni deduplicar.
    expect(rows.map((row) => row.alert_id)).toEqual([first?.id, first?.id, second?.id])
    expect(codesOf(rows.slice(0, 2))).toEqual(sorted([tobi.code, litter.code]))
    expect(rows[2]?.code).toBe(tobi.code)
    expect(codesOf(rows)).not.toEqual(expect.arrayContaining(young))
    const litterRow = rows.find((row) => row.kind === 'litter')
    expect(litterRow).toMatchObject({ name: 'La camada de Luna', young_count: 3, ...ZONE })
    expect(rows.find((row) => row.kind === 'pet')).toMatchObject({
      name: 'Tobi',
      item_species: 'dog',
      sex: 'female',
      department: 'UY-TT',
      locality: 'Vergara',
      cover_id: tobi.photoIds[0],
    })
    const runAt = time(rows[0]?.run_at)
    for (const row of rows) {
      expect(time(row.run_at)).toBe(runAt)
      expect(time(row.first_listed_at)).toBeGreaterThan(time(first?.created_at))
      expect(time(row.first_listed_at)).toBeLessThanOrEqual(runAt)
    }
    // Hasta que la ruta diga que el correo salió, el período queda abierto.
    expect(await coveredOf(bruno.id)).toEqual([first?.created_at, second?.created_at])
  })

  // Covers: US2-AS10, US2-AS11, FR-015 (lo que ya estaba a la vista no vuelve como nuevo)
  it('lo que ya se veía al crear el aviso no llega, aunque se renueve o se edite', async () => {
    const carla = await publisher()
    const luna = await petIn(carla.id, 'Luna')
    const bruno = await brunoWithAlert()
    for (const action of ['pause', 'resume', 'renew'] as const) {
      // oxlint-disable-next-line no-await-in-loop -- una acción después de la otra, como la dueña
      expect(await changed(carla.id, luna.petId, action)).toMatchObject({ outcome: 'done' })
    }
    const edited = await db().from('pets').update({ description: 'Ahora sí.' }).eq('id', luna.petId)
    expect(edited.error).toBeNull()

    expect(await claimFor(bruno.id)).toEqual([])
  })

  // Covers: US2-AS2, FR-015, FR-016, SC-003 (lo que no se puede solicitar a las 8 no va, y lo que la
  // corrida ya miró no vuelve al reanudarse)
  it('pausado, adoptado, vencido, dado de baja o borrado antes de las 8 no llega, ni reanudado', async () => {
    const bruno = await brunoWithAlert()
    const carla = await publisher()
    const [paused, adopted, expired, takenDown, deleted] = await Promise.all(
      ['Tobi', 'Coco', 'Lola', 'Pipa', 'Rufo'].map((name) => petIn(carla.id, name)),
    )
    // La marca de cada 5 minutos ya los vio antes de que cambiaran.
    await stampFirstListed()
    await setState(paused?.petId ?? '', 'paused')
    await setState(adopted?.petId ?? '', 'adopted')
    await setState(expired?.petId ?? '', 'expired')
    await setState(takenDown?.petId ?? '', 'taken_down')
    const removed = await db()
      .from('pets')
      .delete()
      .eq('id', deleted?.petId ?? '')
    expect(removed.error).toBeNull()

    expect(await claimFor(bruno.id)).toEqual([])

    await setState(paused?.petId ?? '', 'available')
    await nextDay(bruno.id)
    expect(await claimFor(bruno.id)).toEqual([])
  })

  // Covers: US2-AS5, FR-017, SC-003 (ni lo propio ni lo de un bloqueo, en las dos direcciones)
  it('no trae lo de la persona ni lo de alguien con un bloqueo en cualquier dirección', async () => {
    const bruno = await brunoWithAlert()
    const [rita, carla, ana] = await Promise.all([publisher(), publisher(), publisher()])
    await block(rita.id, bruno.id)
    await block(bruno.id, carla.id)
    await Promise.all([petIn(bruno.id), petIn(rita.id), petIn(carla.id)])
    const anas = await petIn(ana.id, 'Moro')

    expect(codesOf(await claimFor(bruno.id))).toEqual([anas.code])
  })
})

describeDb('cuándo se cierra el período (R2)', () => {
  // Covers: US2-AS6, FR-021 (sin nada nuevo no hay correo, y el día queda cubierto)
  it('sin nada nuevo no la devuelve, reclama el día y avanza lo cubierto', async () => {
    const bruno = await brunoWithAlert()
    const [alert] = await alertsOf(bruno.id)

    expect(await claimFor(bruno.id)).toEqual([])

    expect(await sendsOf(bruno.id)).toHaveLength(1)
    const [covered] = await coveredOf(bruno.id)
    expect(time(covered)).toBeGreaterThan(time(alert?.created_at))
  })

  // Covers: US2-AS7, FR-024 (suspendida, nada; lo de esos días no llega al levantarse)
  it('una cuenta suspendida no se devuelve, y lo de esos días no llega después', async () => {
    const bruno = await brunoWithAlert()
    const [alert] = await alertsOf(bruno.id)
    const suspension = await suspend(bruno.id)
    const carla = await publisher()
    await petIn(carla.id)

    expect(await claimFor(bruno.id)).toEqual([])
    const [covered] = await coveredOf(bruno.id)
    expect(time(covered)).toBeGreaterThan(time(alert?.created_at))

    await lift(suspension)
    await nextDay(bruno.id)
    expect(await claimFor(bruno.id)).toEqual([])
  })

  // Covers: US2-AS8, FR-021 (un correo que no salió: el siguiente trae todo desde el último que
  // llegó; uno que salió no vuelve)
  it('sin el correo marcado, la corrida siguiente trae los dos días; marcado, nada vuelve', async () => {
    const bruno = await brunoWithAlert()
    const carla = await publisher()
    const tobi = await petIn(carla.id)
    expect(codesOf(await claimFor(bruno.id))).toEqual([tobi.code])

    const coco = await petIn(carla.id, 'Coco')
    await nextDay(bruno.id)
    const rows = await claimFor(bruno.id)
    expect(codesOf(rows)).toEqual(sorted([tobi.code, coco.code]))

    await markMailed(bruno.id, rows[0]?.run_at ?? '')
    expect(await coveredOf(bruno.id)).toEqual([rows[0]?.run_at])
    await nextDay(bruno.id)
    expect(await claimFor(bruno.id)).toEqual([])
  })

  // Covers: FR-014, spec §Edge Cases «La corrida que llega tarde» (a lo sumo un correo por día)
  it('dos corridas el mismo día no la reclaman dos veces', async () => {
    const bruno = await brunoWithAlert()
    const [alert] = await alertsOf(bruno.id)
    const carla = await publisher()
    const tobi = await petIn(carla.id)

    expect(codesOf(await claimFor(bruno.id))).toEqual([tobi.code])
    expect(await claimFor(bruno.id)).toEqual([])

    expect(await sendsOf(bruno.id)).toHaveLength(1)
    expect(await coveredOf(bruno.id)).toEqual([alert?.created_at])
  })

  // Covers: FR-031 (el correo marcado cubre lo que la corrida miró, no lo creado después)
  it('marcar el correo no toca un aviso creado después de la corrida', async () => {
    const bruno = await brunoWithAlert()
    const carla = await publisher()
    await petIn(carla.id)
    const [row] = await claimFor(bruno.id)
    await alertFor(bruno.client, { species: ['cat'] })

    await markMailed(bruno.id, row?.run_at ?? '')

    const [first, later] = await alertsOf(bruno.id)
    expect(first?.covered_until).toBe(row?.run_at)
    expect(later?.covered_until).toBe(later?.created_at)
  })
})
