// «¿Por qué lo borrás?» en la base (historia #263, SC-002, research R2, R3): exactamente una
// respuesta por borrado hecho con la pregunta, ninguna sin borrado, y la misma regla de cuándo se
// pregunta que la pantalla. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { LITTER_STATES } from '../../src/lib/litters/types'
import {
  DELETION_ANSWERS,
  litterAsksDeletionReason,
  petAsksDeletionReason,
  type DeletionReason,
} from '../../src/lib/pets/deletion-reason'
import { PET_STATES, type PetState } from '../../src/lib/pets/types'
import { describeDb } from '../setup/env-report'
import {
  deleteLitterAs,
  deletePetAs,
  litterIn,
  petIn,
  reasonsLeftBy,
  totalReasons,
  uruguayToday,
} from './deletion-reasons-support'
import { petRow } from './lifecycle-support'
import { litterRow, removeYoung, setYoungState, youngOf } from './litter-support'
import { publishers, sql } from './listing-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('borrar un animal con la pregunta', () => {
  const ASKED: [PetState, DeletionReason][] = [
    ['available', 'no_applications'],
    ['in_process', 'unconvincing_applications'],
    ['paused', 'given_elsewhere'],
    ['expired', 'not_for_adoption'],
  ]

  // Covers: US1-AS2, FR-001, FR-010, FR-024 (la opción, el día de Uruguay y que era un animal)
  it.each(ASKED)('%s: borra y cuenta una respuesta con %s', async (state, reason) => {
    const carla = await publisher()
    const { petId, code } = await petIn(carla.id, state)
    const today = await uruguayToday()
    let result: Awaited<ReturnType<typeof deletePetAs>> | undefined
    const left = await reasonsLeftBy(async () => {
      result = await deletePetAs(carla.id, petId, reason)
    })
    expect(result?.error).toBeNull()
    expect(result?.row).toMatchObject({
      outcome: 'done',
      code,
      from_state: state,
      reason_counted: true,
    })
    expect(left).toEqual([{ kind: 'pet', reason, deleted_on: today }])
    expect(await petRow(petId)).toBeNull()
  })

  // Covers: US1-AS3 (sin elegir nada, se cuenta sin contestar)
  it('sin opción elegida cuenta una respuesta sin contestar', async () => {
    const carla = await publisher()
    const { petId } = await petIn(carla.id, 'available')
    const left = await reasonsLeftBy(() => deletePetAs(carla.id, petId, 'unanswered'))
    expect(left).toEqual([{ kind: 'pet', reason: 'unanswered', deleted_on: await uruguayToday() }])
  })

  // Covers: FR-003 (la confirmación no mostró la pregunta: nada que contar)
  it('sin la pregunta borra y no cuenta nada', async () => {
    const carla = await publisher()
    const { petId } = await petIn(carla.id, 'available')
    const before = await totalReasons()
    const { row } = await deletePetAs(carla.id, petId)
    expect(row).toMatchObject({ outcome: 'done', reason_counted: false })
    expect(await petRow(petId)).toBeNull()
    expect(await totalReasons()).toBe(before)
  })
})

describeDb('lo que no se cuenta', () => {
  // Covers: US1-AS6, US1-AS7, US1-AS10, FR-012 (adoptado o dado de baja al confirmar, también si
  // cambió en otra pestaña después de abrir la confirmación)
  it.each(['adopted', 'taken_down'] as const)(
    '%s: borra como siempre aunque llegue una opción, y no la cuenta',
    async (state) => {
      const carla = await publisher()
      const { petId } = await petIn(carla.id, state)
      const before = await totalReasons()
      const { row, error } = await deletePetAs(carla.id, petId, 'no_applications')
      expect(error).toBeNull()
      expect(row).toMatchObject({ outcome: 'done', from_state: state, reason_counted: false })
      expect(await petRow(petId)).toBeNull()
      expect(await totalReasons()).toBe(before)
    },
  )

  // Covers: US1-AS8, US1-AS9, FR-011 (el doble toque y el reintento encuentran el animal borrado)
  it('el segundo borrado no encuentra el animal y no cuenta otra respuesta', async () => {
    const carla = await publisher()
    const { petId } = await petIn(carla.id, 'available')
    const left = await reasonsLeftBy(async () => {
      await deletePetAs(carla.id, petId, 'other')
      const again = await deletePetAs(carla.id, petId, 'other')
      expect(again.row).toMatchObject({ outcome: 'not_found', reason_counted: false })
    })
    expect(left).toHaveLength(1)
  })

  // Covers: FR-011 (un borrado que no se hizo no deja nada)
  it('una opción que no existe no borra ni cuenta', async () => {
    const carla = await publisher()
    const { petId } = await petIn(carla.id, 'available')
    const before = await totalReasons()
    const { error } = await deletePetAs(carla.id, petId, 'groups')
    expect(error?.code).toBe('23514')
    expect(await petRow(petId)).not.toBeNull()
    expect(await totalReasons()).toBe(before)
  })

  // Covers: FR-011 (el animal de otra persona no se borra ni cuenta)
  it('el animal de otra persona no se borra ni cuenta', async () => {
    const carla = await publisher()
    const juan = await publisher()
    const { petId } = await petIn(carla.id, 'available')
    const before = await totalReasons()
    const { row } = await deletePetAs(juan.id, petId, 'other')
    expect(row).toMatchObject({ outcome: 'not_found', reason_counted: false })
    expect(await petRow(petId)).not.toBeNull()
    expect(await totalReasons()).toBe(before)
  })
})

describeDb('las reglas de la base son las de lib/pets/deletion-reason.ts (R3)', () => {
  // Covers: FR-001, FR-003, SC-002 (la base cuenta en los mismos estados en que la pantalla pregunta)
  it.each(PET_STATES)('%s: la base cuenta si y solo si la pantalla pregunta', async (state) => {
    const carla = await publisher()
    const { petId } = await petIn(carla.id, state)
    const { row } = await deletePetAs(carla.id, petId, 'other')
    expect(row?.outcome).toBe('done')
    expect(row?.reason_counted).toBe(petAsksDeletionReason(state))
  })

  // Covers: R1 (las respuestas que acepta la tabla son las del código, más sin contestar)
  it('la tabla acepta exactamente las respuestas de DELETION_ANSWERS', async () => {
    const [constraint] = await sql<{ definition: string }>(
      `select pg_get_constraintdef(oid) as definition from pg_constraint
        where conname = 'deletion_reasons_reason_valid'`,
    )
    const accepted = [...(constraint?.definition ?? '').matchAll(/'([a-z_]+)'::text/g)].map(
      (match) => match[1],
    )
    expect(accepted).toEqual([...DELETION_ANSWERS])
  })
})

describeDb('borrar una camada con la pregunta', () => {
  const ASKED = [
    ['available', 'no_applications', false],
    ['available', 'given_elsewhere', true],
    ['paused', 'unconvincing_applications', false],
    ['paused', 'other', true],
    ['expired', 'not_for_adoption', false],
  ] as const

  // Covers: US2-AS1, FR-002, FR-024 (una sola respuesta por la camada entera, también con la cría
  // que queda en proceso)
  it.each(ASKED)(
    '%s con una cría sin adoptar: borra y cuenta una respuesta de camada con %s (en proceso: %s)',
    async (state, reason, lastInProcess) => {
      const carla = await publisher()
      const litter = await litterIn(carla.id, state, { lastInProcess })
      const today = await uruguayToday()
      let result: Awaited<ReturnType<typeof deleteLitterAs>> | undefined
      const left = await reasonsLeftBy(async () => {
        result = await deleteLitterAs(carla.id, litter.litterId, reason)
      })
      expect(result?.error).toBeNull()
      expect(result?.row).toMatchObject({
        outcome: 'done',
        code: litter.code,
        reason_counted: true,
      })
      expect(left).toEqual([{ kind: 'litter', reason, deleted_on: today }])
      expect(await youngOf(litter.litterId)).toEqual([])
    },
  )

  // Covers: US2-AS1 (sin elegir nada, la camada cuenta sin contestar)
  it('sin opción elegida cuenta una respuesta de camada sin contestar', async () => {
    const carla = await publisher()
    const litter = await litterIn(carla.id, 'available')
    const left = await reasonsLeftBy(() => deleteLitterAs(carla.id, litter.litterId, 'unanswered'))
    expect(left).toEqual([
      { kind: 'litter', reason: 'unanswered', deleted_on: await uruguayToday() },
    ])
  })
})

describeDb('lo que no se cuenta de una camada', () => {
  // Covers: US2-AS2, US2-AS3, FR-003 (adoptada entera o dada de baja: se borra y no cuenta)
  it.each(['adopted', 'taken_down'] as const)(
    '%s: borra como siempre aunque llegue una opción, y no la cuenta',
    async (state) => {
      const carla = await publisher()
      const litter = await litterIn(carla.id, state)
      const before = await totalReasons()
      const { row, error } = await deleteLitterAs(carla.id, litter.litterId, 'no_applications')
      expect(error).toBeNull()
      expect(row).toMatchObject({ outcome: 'done', reason_counted: false })
      expect(await youngOf(litter.litterId)).toEqual([])
      expect(await totalReasons()).toBe(before)
    },
  )

  // Covers: US2-AS6, FR-012 (la última cría se marcó adoptada en otra pestaña)
  it('la última cría adoptada después de abrir la confirmación: borra y no cuenta', async () => {
    const carla = await publisher()
    const litter = await litterIn(carla.id, 'available')
    await setYoungState(litter.lastId, 'adopted')
    const before = await totalReasons()
    const { row } = await deleteLitterAs(carla.id, litter.litterId, 'given_elsewhere')
    expect(row).toMatchObject({ outcome: 'done', reason_counted: false })
    expect(await totalReasons()).toBe(before)
  })

  // Covers: FR-011 (el doble toque y el reintento encuentran la camada borrada)
  it('el segundo borrado no encuentra la camada y no cuenta otra respuesta', async () => {
    const carla = await publisher()
    const litter = await litterIn(carla.id, 'available')
    const left = await reasonsLeftBy(async () => {
      await deleteLitterAs(carla.id, litter.litterId, 'other')
      const again = await deleteLitterAs(carla.id, litter.litterId, 'other')
      expect(again.row).toMatchObject({ outcome: 'not_found', reason_counted: false })
    })
    expect(left).toHaveLength(1)
  })

  // Covers: FR-011 (un borrado que no se hizo no deja nada)
  it('una opción que no existe no borra la camada ni cuenta', async () => {
    const carla = await publisher()
    const litter = await litterIn(carla.id, 'available')
    const before = await totalReasons()
    const { error } = await deleteLitterAs(carla.id, litter.litterId, 'groups')
    expect(error?.code).toBe('23514')
    expect(await litterRow(litter.litterId)).not.toBeNull()
    expect(await youngOf(litter.litterId)).toHaveLength(3)
    expect(await totalReasons()).toBe(before)
  })

  // Covers: US2-AS4, FR-004 (quitar una cría no pregunta, tampoco la última, que borra la camada)
  it('quitar una cría, y después la última, no cuenta nada', async () => {
    const carla = await publisher()
    const litter = await litterIn(carla.id, 'available')
    const [first] = litter.young
    const before = await totalReasons()
    expect(await removeYoung(carla.id, first?.id ?? '')).toMatchObject({
      outcome: 'young_deleted',
    })
    const rest = await youngOf(litter.litterId)
    for (const one of rest.slice(0, -1)) {
      // oxlint-disable-next-line no-await-in-loop
      await removeYoung(carla.id, one.id)
    }
    expect(await removeYoung(carla.id, rest.at(-1)?.id ?? '')).toMatchObject({
      outcome: 'litter_deleted',
    })
    expect(await litterRow(litter.litterId)).toBeNull()
    expect(await totalReasons()).toBe(before)
  })
})

describeDb('las reglas de la camada son las de lib/pets/deletion-reason.ts (R3)', () => {
  // Covers: FR-002, FR-003, SC-002 (la base cuenta en los mismos estados en que la pantalla pregunta)
  it.each(LITTER_STATES)('%s: la base cuenta si y solo si la pantalla pregunta', async (state) => {
    const carla = await publisher()
    const litter = await litterIn(carla.id, state)
    const { row } = await deleteLitterAs(carla.id, litter.litterId, 'other')
    expect(row?.outcome).toBe('done')
    expect(row?.reason_counted).toBe(litterAsksDeletionReason(state))
  })
})
