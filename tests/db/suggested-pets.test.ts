// Otros animales para pedir cuando una solicitud se cerró sin ser elegida (historia #259). La función
// elige entre lo que el listado ya muestra: de la misma especie, primero del departamento de quien
// solicitó, los más recientes primero, nunca de quien publicó el que pidió, propios, ya pedidos, no
// aceptados ni de alguien con quien hay un bloqueo. Y nadie lee los de una solicitud ajena.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { insertApplication, petOf } from './applications-support'
import { applyForYoung, listLitter, youngList, youngOf } from './litter-support'
import { futureWindow, listPet, type Window } from './listing-support'
import { block, moderationPeople } from './moderation-support'
import { db, type Functions } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

type Client = SyntheticUser['client']
type Row = Functions['suggested_pets']['Returns'][number]

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = moderationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

const NEAR = { department: 'UY-TT', locality: 'Vergara' }
const FAR = { department: 'UY-RV', locality: 'Tranqueras' }

async function livesIn(userId: string, department: string) {
  const { error } = await db().from('profiles').update({ department }).eq('id', userId)
  expect(error).toBeNull()
}

async function suggested(client: Client, applicationId: string) {
  const { data, error } = await client.rpc('suggested_pets', {
    p_application_id: applicationId,
    p_limit: 241,
  })
  const rows: Row[] = data ?? []
  return { rows, error }
}

// Las del listado real se mezclan con las de otras pruebas: se miran solo los códigos de esta.
function ours(rows: { code: string }[], codes: readonly string[]): string[] {
  return rows.map((row) => row.code).filter((code) => codes.includes(code))
}

// Bruno vive en Treinta y Tres y Carla le rechazó a Tobi, un perro.
async function rejectedBruno() {
  const bruno = await person(1, 'Bruno')
  await livesIn(bruno.id, NEAR.department)
  const carla = await person(1, 'Carla')
  const tobi = await petOf(carla, { name: 'Tobi' })
  const applicationId = await insertApplication(bruno, tobi, carla, { status: 'rejected' })
  return { bruno, carla, applicationId }
}

async function dogOf(owner: { id: string }, window: Window, minute: number, zone = FAR) {
  const pet = await listPet(owner.id, { publishedAt: window.at(minute), fields: zone })
  return pet.code
}

describeDb('los sugeridos de una solicitud cerrada', () => {
  // Covers: historia #259, criterio 1
  it('primero los del departamento de quien solicitó y después el resto, los más nuevos primero', async () => {
    const window = futureWindow()
    const { bruno, applicationId } = await rejectedBruno()
    const ana = await person(1, 'Ana')
    const nearOld = await dogOf(ana, window, 1, NEAR)
    const farOld = await dogOf(ana, window, 2)
    const nearNew = await dogOf(ana, window, 3, NEAR)
    const farMid = await dogOf(ana, window, 4)
    const farNew = await dogOf(ana, window, 5)
    const all = [nearOld, nearNew, farOld, farMid, farNew]

    const { rows, error } = await suggested(bruno.client, applicationId)

    expect(error).toBeNull()
    expect(ours(rows, all)).toEqual([nearNew, nearOld, farNew, farMid, farOld])
  })

  // Covers: historia #259, criterio 1 (hasta 3)
  it('sin límite pedido trae tres', async () => {
    const { bruno, applicationId } = await rejectedBruno()
    const window = futureWindow()
    const ana = await person(1, 'Ana')
    await Promise.all([1, 2, 3, 4].map((minute) => dogOf(ana, window, minute, NEAR)))

    const { data, error } = await bruno.client.rpc('suggested_pets', {
      p_application_id: applicationId,
    })

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
  })

  // Covers: historia #259, criterio 2
  it('nada de quien publicó, propio, ya pedido, no aceptado, con bloqueo ni de otra especie', async () => {
    const window = futureWindow()
    const { bruno, carla, applicationId } = await rejectedBruno()
    const [luna, mora, rita, pedro, ana] = await Promise.all([
      person(1, 'Dueña de Luna'),
      person(1, 'Dueña de Mora'),
      person(1, 'Rita'),
      person(1, 'Pedro'),
      person(1, 'Ana'),
    ])
    const lunaPet = await listPet(luna.id, { publishedAt: window.at(1), fields: FAR })
    const moraPet = await listPet(mora.id, { publishedAt: window.at(2), fields: FAR })
    await insertApplication(bruno, lunaPet, luna, { status: 'sent' })
    await insertApplication(bruno, moraPet, mora, { status: 'rejected' })
    const ritaDog = await dogOf(rita, window, 3)
    await block(rita.id, bruno.id)
    const pedroDog = await dogOf(pedro, window, 4)
    await block(bruno.id, pedro.id)
    const carlaDog = await dogOf(carla, window, 5)
    const ownDog = await dogOf(bruno, window, 6)
    const cat = (
      await listPet(ana.id, { publishedAt: window.at(7), fields: { ...FAR, species: 'cat' } })
    ).code
    const fine = await dogOf(ana, window, 8)
    const litter = await listLitter(ana.id, window.at(9), youngList(3), { ...FAR, species: 'dog' })
    // Una camada en la que ya pidió cada cría no le deja nada para pedir.
    const asked = await listLitter(ana.id, window.at(10), youngList(2), { ...FAR, species: 'dog' })
    const askedYoung = await youngOf(asked.litterId)
    await Promise.all(askedYoung.map((young) => applyForYoung(bruno, young, ana)))
    const excluded = [lunaPet.code, moraPet.code, ritaDog, pedroDog, carlaDog, ownDog, cat]
    const all = [...excluded, fine, litter.code, asked.code]

    const { rows, error } = await suggested(bruno.client, applicationId)

    expect(error).toBeNull()
    expect(ours(rows, all)).toEqual([litter.code, fine])
    expect(rows.find((row) => row.code === litter.code)?.kind).toBe('litter')
  })

  // Covers: historia #259, privacidad de la solicitud
  it('otra persona no lee los sugeridos de una solicitud que no es suya', async () => {
    const window = futureWindow()
    const { applicationId } = await rejectedBruno()
    const ana = await person(1, 'Ana')
    await dogOf(ana, window, 1, NEAR)
    const stranger = await person(1, 'Otra')

    const { rows, error } = await suggested(stranger.client, applicationId)

    expect(error).toBeNull()
    expect(rows).toEqual([])
  })

  it('sin sesión no se puede preguntar', async () => {
    const { applicationId } = await rejectedBruno()

    const { rows, error } = await suggested(anonClient(), applicationId)

    expect(error).not.toBeNull()
    expect(rows).toEqual([])
  })
})
