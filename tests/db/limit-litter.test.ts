// La pantalla del máximo de solicitudes activas nombra la camada de cada cría (historia #278): con
// dos «Cría 2» de camadas distintas, quien adopta tiene que saber cuál retira.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  applicationPeople,
  contextOf,
  insertApplication,
  petOf,
  type Context,
} from './applications-support'
import { applyForYoung, litterWithYoung } from './litter-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person } = applicationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

function activeOf(context: Context | undefined): unknown[] {
  const active: unknown = context?.active
  return Array.isArray(active) ? active : []
}

describeDb('la pantalla del máximo de solicitudes activas', () => {
  // Covers: #278 criterios 1 y 2
  it('cada cría llega con el nombre de su camada y un animal suelto sin ninguno', async () => {
    const publisher = await person(1, 'Quien publica')
    const bruno = await person(1, 'Bruno')
    const luna = await litterWithYoung(publisher.id, 2)
    const kira = await litterWithYoung(publisher.id, 2)
    const { error } = await db()
      .from('litters')
      .update({ name: 'La camada de Kira' })
      .eq('id', kira.litterId)
    expect(error).toBeNull()
    const tobi = await petOf(publisher)

    const fromLuna = await applyForYoung(bruno, luna.young[1], publisher)
    const fromKira = await applyForYoung(bruno, kira.young[1], publisher)
    const loose = await insertApplication(bruno, tobi, publisher)

    const [context] = await contextOf(bruno, luna.young[0].code)
    const active = activeOf(context)
    expect(active).toHaveLength(3)
    expect(active).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: fromLuna, name: 'Cría 2', litter_name: 'La camada de Luna' }),
        expect.objectContaining({ id: fromKira, name: 'Cría 2', litter_name: 'La camada de Kira' }),
        expect.objectContaining({ id: loose, name: 'Tobi', litter_name: null }),
      ]),
    )
  })
})
