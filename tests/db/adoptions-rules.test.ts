// Marcar adoptado eligiendo a quién se entregó, en la base (historia #67, research R3): solo una
// aceptada de ese animal y de ese publicador, una sola vez por intento, en una transacción que
// cierra la elegida y las demás. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { markAccepted, setStatus } from './application-responses-support'
import { insertApplication, submit, withdraw } from './applications-support'
import {
  acceptCommitment,
  adoptionPeople,
  adoptionsOf,
  declineAdoption,
  markAdopted,
  stampAdoption,
  statusOf,
  type HandoverScene,
} from './adoptions-support'
import { changed, petRow, setState } from './lifecycle-support'
import { block, suspend } from './moderation-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, handoverScene, publisherWithPet } = adoptionPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function unchanged(scene: HandoverScene) {
  expect((await petRow(scene.pet.petId))?.status).toBe('available')
  expect(await adoptionsOf(scene.pet.petId)).toEqual([])
}

describeDb('a quién se puede elegir (FR-004)', () => {
  // Covers: US1-AS3, FR-001, FR-006
  it('a una aceptada: queda adoptado, ella con su motivo y las otras como que encontró hogar', async () => {
    const scene = await handoverScene({ neutered: false })
    const row = await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)

    expect(row).toMatchObject({
      outcome: 'done',
      detail: 'Ana',
      code: scene.pet.code,
      name: 'Tobi',
      sex: 'female',
      from_state: 'available',
      accepted_count: 2,
    })
    expect(row.published_at).not.toBeNull()
    expect(row.accepted_at).not.toBeNull()
    expect((await petRow(scene.pet.petId))?.status).toBe('adopted')
    expect(await statusOf(scene.chosenId)).toEqual({
      status: 'closed',
      close_reason: 'handed_over',
    })
    expect(await statusOf(scene.otherId)).toEqual({ status: 'closed', close_reason: 'adopted' })
    expect(await statusOf(scene.waitingId)).toEqual({ status: 'closed', close_reason: 'adopted' })

    const [adoption] = await adoptionsOf(scene.pet.petId)
    expect(adoption).toMatchObject({
      kind: 'site',
      application_id: scene.chosenId,
      adopter_id: scene.chosen.id,
      publisher_id: scene.publisher.id,
      includes_neuter: true,
      adopter_accepted_at: null,
      declined_at: null,
      contact_cut_at: null,
      ended_at: null,
    })
  })

  // Covers: FR-006 (la elegida deja de contar entre sus 3 activas)
  it('la elegida ya no cuenta entre sus activas y puede solicitar otro', async () => {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    const another = await publisherWithPet({ name: 'Luna' })
    expect((await submit(scene.chosen, another.pet.code)).outcome).toBe('sent')
    const { count } = await db()
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('applicant_id', scene.chosen.id)
      .in('status', ['sent', 'accepted'])
    expect(count).toBe(1)
  })

  // Covers: FR-004, FR-005 (esperando, rechazada o ajena no se eligen)
  it('una que espera, una rechazada, la de otro animal o la de otra publicadora: not_found', async () => {
    const scene = await handoverScene()
    const rejected = await insertApplication(scene.waiting, scene.pet, scene.publisher, {
      status: 'rejected',
    })
    const elsewhere = await publisherWithPet({ name: 'Luna' })
    const foreign = await insertApplication(scene.chosen, elsewhere.pet, elsewhere.publisher)
    await markAccepted(foreign)

    for (const id of [scene.waitingId, rejected, foreign]) {
      // oxlint-disable-next-line no-await-in-loop -- de a una: el animal no tiene que cambiar
      const row = await markAdopted(scene.publisher, scene.pet.petId, id)
      expect({ id, outcome: row.outcome }).toEqual({ id, outcome: 'not_found' })
    }
    await unchanged(scene)
  })

  // Covers: US1-AS8, FR-004 (dejó de estar aceptada mientras se elegía)
  it('la retiró, se bloquearon o se suspendió: gone o you_blocked con su nombre, y no se marca', async () => {
    const withdrawn = await handoverScene()
    await withdraw(withdrawn.chosen, withdrawn.chosenId)
    const blockedByApplicant = await handoverScene()
    await block(blockedByApplicant.chosen.id, blockedByApplicant.publisher.id)
    const suspended = await handoverScene()
    await suspend(suspended.chosen.id)
    const blockedByPublisher = await handoverScene()
    await block(blockedByPublisher.publisher.id, blockedByPublisher.chosen.id)

    const cases = [
      [withdrawn, 'gone'],
      [blockedByApplicant, 'gone'],
      [suspended, 'gone'],
      [blockedByPublisher, 'you_blocked'],
    ] as const
    for (const [scene, outcome] of cases) {
      // oxlint-disable-next-line no-await-in-loop -- de a una escena
      const row = await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
      expect(row).toMatchObject({ outcome, detail: 'Ana' })
      // oxlint-disable-next-line no-await-in-loop
      await unchanged(scene)
    }
  })

  // Covers: FR-004 (el publicador la dejó sin efecto desde otra pestaña)
  it('dejada sin efecto: revoked con su nombre, y no se marca', async () => {
    const scene = await handoverScene()
    await setStatus(scene.chosenId, 'rejected')
    const row = await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    expect(row).toMatchObject({ outcome: 'revoked', detail: 'Ana' })
    await unchanged(scene)
  })

  // Covers: FR-005 (cada persona marca solo sus animales)
  it('un animal ajeno o que no existe: not_found y no cambia', async () => {
    const scene = await handoverScene()
    const stranger = await person(1, 'Otra')
    expect((await markAdopted(stranger, scene.pet.petId, scene.chosenId)).outcome).toBe('not_found')
    expect((await markAdopted(scene.publisher, crypto.randomUUID(), null)).outcome).toBe(
      'not_found',
    )
    await unchanged(scene)
  })
})

describeDb('una sola vez, y el estado de ahora (FR-055, Edge Cases)', () => {
  // Covers: US1-AS10, SC-004 (doble toque y reintento)
  it('el mismo intento dos veces: una fila, already con su nombre, y un solo aviso', async () => {
    const scene = await handoverScene()
    const attempt = crypto.randomUUID()
    expect(
      (await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId, attempt)).outcome,
    ).toBe('done')
    const again = await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId, attempt)
    expect(again).toMatchObject({ outcome: 'already', detail: 'Ana' })
    expect(await adoptionsOf(scene.pet.petId)).toHaveLength(1)
    const { count } = await db()
      .from('application_notices')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'adoption_marked')
      .eq('application_id', scene.chosenId)
    expect(count).toBe(1)
  })

  // Covers: US1-AS10, edge «dos pestañas marcan a la vez»
  it('otro intento sobre uno ya adoptado: changed, y gana el primero', async () => {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    const second = await markAdopted(scene.publisher, scene.pet.petId, null)
    expect(second).toMatchObject({ outcome: 'changed', from_state: 'adopted' })
    const rows = await adoptionsOf(scene.pet.petId)
    expect(rows.map((row) => row.kind)).toEqual(['site'])
  })

  // Covers: edge «marcar un pausado, vencido o en proceso»; «el animal cambió mientras se elegía»
  it('desde pausado, vencido o en proceso se marca; dado de baja, no', async () => {
    for (const state of ['paused', 'expired', 'in_process'] as const) {
      // oxlint-disable-next-line no-await-in-loop -- un animal por estado
      const scene = await handoverScene({ state })
      // oxlint-disable-next-line no-await-in-loop
      const row = await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
      expect({ state, outcome: row.outcome, from: row.from_state }).toEqual({
        state,
        outcome: 'done',
        from: state,
      })
    }
    const takenDown = await handoverScene()
    await setState(takenDown.pet.petId, 'taken_down')
    expect((await markAdopted(takenDown.publisher, takenDown.pet.petId, null)).outcome).toBe(
      'changed',
    )
    expect(await adoptionsOf(takenDown.pet.petId)).toEqual([])
  })

  // Covers: R3 (change_pet_status ya no adopta: no queda un camino que marque sin elegir)
  it('change_pet_status con mark_adopted no marca: changed', async () => {
    const scene = await handoverScene()
    const row = await changed(scene.publisher.id, scene.pet.petId, 'mark_adopted')
    expect(row).toMatchObject({ outcome: 'changed', state: 'available' })
    await unchanged(scene)
  })
})

describeDb('lo que queda guardado (FR-011, FR-060, FR-061)', () => {
  // Covers: US1-AS7, FR-011, SC-006
  it('la línea de la castración es la de al marcar y no cambia al editar el animal', async () => {
    const neutered = await handoverScene({ neutered: true })
    await markAdopted(neutered.publisher, neutered.pet.petId, neutered.chosenId)
    const intact = await handoverScene({ neutered: false })
    await markAdopted(intact.publisher, intact.pet.petId, intact.chosenId)
    const edited = await db().from('pets').update({ is_neutered: true }).eq('id', intact.pet.petId)
    expect(edited.error).toBeNull()

    expect((await adoptionsOf(neutered.pet.petId))[0]?.includes_neuter).toBe(false)
    expect((await adoptionsOf(intact.pet.petId))[0]?.includes_neuter).toBe(true)
  })

  // Covers: US1-AS5, FR-061 (por fuera: nada de la persona, y todas cerradas)
  it('por fuera del sitio: sin persona, sin compromiso, y todas como que encontró hogar', async () => {
    const scene = await handoverScene()
    const row = await markAdopted(scene.publisher, scene.pet.petId, null)
    expect(row).toMatchObject({
      outcome: 'done',
      detail: null,
      accepted_at: null,
      accepted_count: 2,
    })
    expect(await adoptionsOf(scene.pet.petId)).toEqual([
      expect.objectContaining({
        kind: 'outside',
        application_id: null,
        adopter_id: null,
        includes_neuter: null,
        adopter_accepted_at: null,
      }),
    ])
    for (const id of [scene.chosenId, scene.otherId, scene.waitingId]) {
      // oxlint-disable-next-line no-await-in-loop
      expect(await statusOf(id)).toEqual({ status: 'closed', close_reason: 'adopted' })
    }
  })

  // Covers: FR-061 (el check rechaza guardar a alguien en una entrega por fuera)
  it('una entrega por fuera con persona no se puede guardar', async () => {
    const scene = await handoverScene()
    const { error } = await db().from('adoptions').insert({
      pet_id: scene.pet.petId,
      publisher_id: scene.publisher.id,
      kind: 'outside',
      adopter_id: scene.chosen.id,
      attempt_id: crypto.randomUUID(),
    })
    expect(error?.message).toContain('adoptions_outside_empty')
  })

  // Covers: FR-060 (lo que se marcó no cambia; las fechas no vuelven atrás)
  it('a quién se entregó y cuándo no se cambian', async () => {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    const [adoption] = await adoptionsOf(scene.pet.petId)
    const moved = await db()
      .from('adoptions')
      .update({ adopter_id: scene.other.id })
      .eq('id', adoption?.id ?? '')
    expect(moved.error?.message).toBe('adoption_final')
    const remarked = await db()
      .from('adoptions')
      .update({ marked_at: new Date(0).toISOString() })
      .eq('id', adoption?.id ?? '')
    expect(remarked.error?.message).toBe('adoption_final')
  })
})

describeDb('aceptar el compromiso (FR-013, FR-055, R5)', () => {
  async function marked() {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    return scene
  }

  // Covers: US2-AS2, FR-012, FR-014
  it('quien adoptó lo acepta: queda con la fecha de hoy y devuelve cuándo se marcó', async () => {
    const scene = await marked()
    const [before] = await adoptionsOf(scene.pet.petId)
    const row = await acceptCommitment(scene.chosen, scene.chosenId)
    expect(row).toEqual({ outcome: 'done', marked_at: before?.marked_at })
    const [after] = await adoptionsOf(scene.pet.petId)
    expect(after?.adopter_accepted_at).not.toBeNull()
    expect(after?.declined_at).toBeNull()
  })

  // Covers: US2-AS6, FR-055 (doble toque)
  it('dos veces: la segunda es already y la fecha no cambia', async () => {
    const scene = await marked()
    await acceptCommitment(scene.chosen, scene.chosenId)
    const [first] = await adoptionsOf(scene.pet.petId)
    const again = await acceptCommitment(scene.chosen, scene.chosenId)
    expect(again).toEqual({ outcome: 'already', marked_at: first?.marked_at })
    const [second] = await adoptionsOf(scene.pet.petId)
    expect(second?.adopter_accepted_at).toBe(first?.adopter_accepted_at)
  })

  // Covers: US2-AS8, FR-013 (solo quien adoptó)
  it('quien lo dio, la otra aceptada u otra persona: not_found y no se acepta', async () => {
    const scene = await marked()
    const stranger = await person(1, 'Otra')
    for (const who of [scene.publisher, scene.other, stranger]) {
      // oxlint-disable-next-line no-await-in-loop -- de a una persona
      const row = await acceptCommitment(who, scene.chosenId)
      expect(row).toEqual({ outcome: 'not_found', marked_at: null })
    }
    expect((await acceptCommitment(scene.other, scene.otherId)).outcome).toBe('not_found')
    expect((await adoptionsOf(scene.pet.petId))[0]?.adopter_accepted_at).toBeNull()
  })

  // Covers: FR-013 (solo mientras la adopción sigue en curso y sin corte)
  it('terminada, deshecha o con el contacto cortado: closed y no se acepta', async () => {
    const now = new Date().toISOString()
    const stamps = [{ ended_at: now }, { declined_at: now }, { contact_cut_at: now }] as const
    for (const stamp of stamps) {
      // oxlint-disable-next-line no-await-in-loop -- una adopción por marca
      const scene = await marked()
      // oxlint-disable-next-line no-await-in-loop
      await stampAdoption(scene.pet.petId, stamp)
      // oxlint-disable-next-line no-await-in-loop
      const row = await acceptCommitment(scene.chosen, scene.chosenId)
      expect({ stamp, outcome: row.outcome }).toEqual({ stamp, outcome: 'closed' })
      // oxlint-disable-next-line no-await-in-loop
      expect((await adoptionsOf(scene.pet.petId))[0]?.adopter_accepted_at).toBeNull()
    }
  })

  // Covers: US2-AS9, FR-034
  it('con la cuenta suspendida: suspended y no se acepta', async () => {
    const scene = await marked()
    await suspend(scene.chosen.id)
    expect((await acceptCommitment(scene.chosen, scene.chosenId)).outcome).toBe('suspended')
    expect((await adoptionsOf(scene.pet.petId))[0]?.adopter_accepted_at).toBeNull()
  })

  // Covers: FR-060 (las fechas no vuelven atrás)
  it('la fecha de aceptado no se borra ni se cambia', async () => {
    const scene = await marked()
    await acceptCommitment(scene.chosen, scene.chosenId)
    const [adoption] = await adoptionsOf(scene.pet.petId)
    for (const value of [null, new Date(0).toISOString()]) {
      // oxlint-disable-next-line no-await-in-loop
      const { error } = await db()
        .from('adoptions')
        .update({ adopter_accepted_at: value })
        .eq('id', adoption?.id ?? '')
      expect(error?.message).toBe('adoption_final')
    }
  })
})

describeDb('«Yo no adopté» (FR-020, FR-021, FR-055, R5)', () => {
  async function marked() {
    const scene = await handoverScene()
    await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
    return scene
  }

  // Covers: US3-AS2, US3-AS3, FR-021
  it('quien adoptó lo dice: queda deshecha, su solicitud encontró hogar y el animal sigue adoptado', async () => {
    const scene = await marked()
    const [before] = await adoptionsOf(scene.pet.petId)
    const row = await declineAdoption(scene.chosen, scene.chosenId)
    expect(row).toEqual({ outcome: 'done', marked_at: before?.marked_at })
    const [after] = await adoptionsOf(scene.pet.petId)
    expect(after?.declined_at).not.toBeNull()
    expect(after?.adopter_accepted_at).toBeNull()
    expect(after?.ended_at).toBeNull()
    expect(after?.adopter_id).toBe(scene.chosen.id)
    expect(await statusOf(scene.chosenId)).toEqual({ status: 'closed', close_reason: 'adopted' })
    expect(await statusOf(scene.otherId)).toEqual({ status: 'closed', close_reason: 'adopted' })
    expect((await petRow(scene.pet.petId))?.status).toBe('adopted')
  })

  // Covers: US3-AS5, FR-055 (doble toque)
  it('dos veces: la segunda es already y la fecha no cambia', async () => {
    const scene = await marked()
    await declineAdoption(scene.chosen, scene.chosenId)
    const [first] = await adoptionsOf(scene.pet.petId)
    const again = await declineAdoption(scene.chosen, scene.chosenId)
    expect(again).toEqual({ outcome: 'already', marked_at: first?.marked_at })
    const [second] = await adoptionsOf(scene.pet.petId)
    expect(second?.declined_at).toBe(first?.declined_at)
  })

  // Covers: FR-020 (solo quien adoptó)
  it('quien lo dio, la otra aceptada u otra persona: not_found y no se deshace', async () => {
    const scene = await marked()
    const stranger = await person(1, 'Otra')
    for (const who of [scene.publisher, scene.other, stranger]) {
      // oxlint-disable-next-line no-await-in-loop -- de a una persona
      const row = await declineAdoption(who, scene.chosenId)
      expect(row).toEqual({ outcome: 'not_found', marked_at: null })
    }
    expect((await declineAdoption(scene.other, scene.otherId)).outcome).toBe('not_found')
    expect((await adoptionsOf(scene.pet.petId))[0]?.declined_at).toBeNull()
    expect(await statusOf(scene.chosenId)).toEqual({
      status: 'closed',
      close_reason: 'handed_over',
    })
  })

  // Covers: US3-AS4, FR-020 (solo pendiente, en curso y sin corte)
  it('aceptada, terminada o con el contacto cortado: closed y no se deshace', async () => {
    const accepted = await marked()
    await acceptCommitment(accepted.chosen, accepted.chosenId)
    expect((await declineAdoption(accepted.chosen, accepted.chosenId)).outcome).toBe('closed')
    expect((await adoptionsOf(accepted.pet.petId))[0]?.declined_at).toBeNull()

    const now = new Date().toISOString()
    for (const stamp of [{ ended_at: now }, { contact_cut_at: now }] as const) {
      // oxlint-disable-next-line no-await-in-loop -- una adopción por marca
      const scene = await marked()
      // oxlint-disable-next-line no-await-in-loop
      await stampAdoption(scene.pet.petId, stamp)
      // oxlint-disable-next-line no-await-in-loop
      const row = await declineAdoption(scene.chosen, scene.chosenId)
      expect({ stamp, outcome: row.outcome }).toEqual({ stamp, outcome: 'closed' })
      // oxlint-disable-next-line no-await-in-loop
      expect((await adoptionsOf(scene.pet.petId))[0]?.declined_at).toBeNull()
      // oxlint-disable-next-line no-await-in-loop
      expect(await statusOf(scene.chosenId)).toEqual({
        status: 'closed',
        close_reason: 'handed_over',
      })
    }
  })

  // Covers: US3-AS6, FR-034
  it('con la cuenta suspendida: suspended y no se deshace', async () => {
    const scene = await marked()
    await suspend(scene.chosen.id)
    expect((await declineAdoption(scene.chosen, scene.chosenId)).outcome).toBe('suspended')
    expect((await adoptionsOf(scene.pet.petId))[0]?.declined_at).toBeNull()
  })

  // Covers: FR-060 (las fechas no vuelven atrás)
  it('después de decirlo no se acepta, y la fecha no se borra', async () => {
    const scene = await marked()
    await declineAdoption(scene.chosen, scene.chosenId)
    expect((await acceptCommitment(scene.chosen, scene.chosenId)).outcome).toBe('closed')
    const [adoption] = await adoptionsOf(scene.pet.petId)
    const { error } = await db()
      .from('adoptions')
      .update({ declined_at: null })
      .eq('id', adoption?.id ?? '')
    expect(error?.message).toBe('adoption_final')
  })
})
