// Lo que le pasa a una solicitud cuando cambia el animal o una de las personas (historia #63, US4):
// los cierres los escribe la base con su causa, solo sobre las activas, y nada los reabre (R3).
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  applicationPeople,
  applicationsOf,
  insertApplication,
  mineAs,
  petOf,
  submit,
} from './applications-support'
import { changed, setExpiry, setState } from './lifecycle-support'
import { block, lift, suspend } from './moderation-support'
import { db } from './phone-support'
import { serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, publisherWithPet } = applicationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function sentBy(applicant: { id: string }, code: string): Promise<string> {
  const sent = await submit(applicant, code)
  expect(sent.outcome).toBe('sent')
  return sent.application_id ?? ''
}

async function rowOf(applicantId: string, id: string) {
  const row = (await applicationsOf(applicantId)).find((candidate) => candidate.id === id)
  if (row === undefined) throw new Error('La solicitud no está')
  return row
}

async function unblock(blocker: string, blocked: string) {
  const { error } = await db()
    .from('blocks')
    .delete()
    .eq('blocker_id', blocker)
    .eq('blocked_id', blocked)
  expect(error).toBeNull()
}

async function closedSince(since: string, scope: { pet?: string; user?: string }) {
  const { data, error } = await db().rpc('closed_applications_since', {
    p_since: since,
    ...(scope.pet === undefined ? {} : { p_pet: scope.pet }),
    ...(scope.user === undefined ? {} : { p_user: scope.user }),
  })
  expect(error).toBeNull()
  return (data ?? []).map((row) => row.reason)
}

describeDb('cierres por el animal', () => {
  // Covers: US4-AS1, US4-AS2, FR-060
  it('pausar, vencer o que el publicador pierda el nivel no la cierran', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)

    await changed(publisher.id, pet.petId, 'pause')
    await changed(publisher.id, pet.petId, 'resume')
    await setExpiry(pet.petId, new Date(Date.now() - 86_400_000).toISOString())

    expect(await rowOf(applicant.id, id)).toMatchObject({ status: 'sent', close_reason: null })
    const { rows } = await mineAs(applicant.client)
    expect(rows[0]).toMatchObject({ id, status: 'sent', pet_on_view: false })
  })

  // Covers: US4-AS1, US4-AS9, FR-061, R11
  it('adoptar la cierra con «encontró hogar» y su nombre; volver a publicar no la reabre', async () => {
    const { publisher, pet } = await publisherWithPet({ name: 'Luna' })
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)
    const since = new Date(Date.now() - 1000).toISOString()

    await changed(publisher.id, pet.petId, 'mark_adopted')

    const closed = await rowOf(applicant.id, id)
    expect(closed).toMatchObject({ status: 'closed', close_reason: 'adopted', pet_name: 'Luna' })
    expect(Date.parse(closed.changed_at)).toBeGreaterThan(Date.parse(closed.sent_at))
    expect(await closedSince(since, { pet: pet.petId })).toEqual(['adopted'])
    expect(await closedSince(new Date().toISOString(), { pet: pet.petId })).toEqual([])

    await changed(publisher.id, pet.petId, 'republish')
    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'adopted',
    })
    expect((await submit(applicant, pet.code)).outcome).toBe('sent')
  })

  // Covers: US4-AS3, FR-061, FR-082
  it('borrar el animal la cierra con «ya no está publicado», sin animal y con el nombre que tenía', async () => {
    const { publisher, pet } = await publisherWithPet({ name: 'Tobi' })
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)
    const since = new Date(Date.now() - 1000).toISOString()

    const { error } = await db().from('pets').delete().eq('id', pet.petId)
    expect(error).toBeNull()

    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'unpublished',
      pet_id: null,
      pet_name: 'Tobi',
    })
    expect(await closedSince(since, { user: publisher.id })).toEqual(['unpublished'])
  })

  // Covers: US4-AS3, FR-061
  it('darlo de baja la cierra con «ya no está publicado»', async () => {
    const { pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)

    await setState(pet.petId, 'taken_down')

    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'unpublished',
    })
  })

  // Covers: FR-061, spec §Edge Cases «El publicador borra su cuenta»
  it('borrar la cuenta del publicador la cierra con «ya no está publicado»', async () => {
    const { publisher, pet } = await publisherWithPet({ name: 'Tobi' })
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)

    const { error } = await serviceClient().auth.admin.deleteUser(publisher.id)
    expect(error).toBeNull()

    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'unpublished',
      pet_id: null,
      publisher_id: null,
      pet_name: 'Tobi',
    })
  })
})

describeDb('cierres por las personas', () => {
  // Covers: US4-AS5, FR-062
  it('el publicador bloquea a quien solicitó: «ya no recibe», y desbloquear no la reabre', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)
    const since = new Date(Date.now() - 1000).toISOString()

    await block(publisher.id, applicant.id)
    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'not_receiving',
    })
    expect(await closedSince(since, { user: publisher.id })).toEqual(['not_receiving'])

    await unblock(publisher.id, applicant.id)
    expect(await rowOf(applicant.id, id)).toMatchObject({ status: 'closed' })
  })

  // Covers: US4-AS6, FR-062
  it('quien solicitó bloquea al publicador: «bloqueaste»; al desbloquear sigue cerrada y puede volver a solicitar', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)

    await block(applicant.id, publisher.id)
    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'you_blocked',
    })

    await unblock(applicant.id, publisher.id)
    expect(await rowOf(applicant.id, id)).toMatchObject({ close_reason: 'you_blocked' })
    expect((await submit(applicant, pet.code)).outcome).toBe('sent')
  })

  // Covers: spec §Edge Cases «Bloqueo mutuo», §Assumptions
  it('bloqueo mutuo: quien solicitó ve «bloqueaste», aunque la otra haya bloqueado primero, y la fecha de cierre no cambia', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)

    await block(publisher.id, applicant.id)
    const first = await rowOf(applicant.id, id)
    await block(applicant.id, publisher.id)

    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'you_blocked',
      changed_at: first.changed_at,
    })
  })

  // Covers: FR-062: solo las activas entre las dos, en las dos direcciones
  it('el bloqueo cierra las de las dos puntas y no toca las de otras personas', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const other = await person(1, 'Otra persona')
    const applicantPet = await petOf(applicant, { name: 'Mora' })
    const mine = await sentBy(applicant, pet.code)
    const theirs = await sentBy(publisher, applicantPet.code)
    const unrelated = await sentBy(other, pet.code)

    await block(applicant.id, publisher.id)

    expect(await rowOf(applicant.id, mine)).toMatchObject({ close_reason: 'you_blocked' })
    expect(await rowOf(publisher.id, theirs)).toMatchObject({ close_reason: 'not_receiving' })
    expect(await rowOf(other.id, unrelated)).toMatchObject({ status: 'sent' })
  })

  // Covers: US4-AS8, FR-064, spec §Edge Cases «La cuenta suspendida de quien solicita, reactivada»
  it('suspender a quien solicitó: «tu cuenta estuvo suspendida», y reactivar no la reabre', async () => {
    const { pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)
    const since = new Date(Date.now() - 1000).toISOString()

    const suspension = await suspend(applicant.id)
    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'suspended',
    })
    expect(await closedSince(since, { user: applicant.id })).toEqual(['suspended'])

    await lift(suspension)
    expect(await rowOf(applicant.id, id)).toMatchObject({ close_reason: 'suspended' })
  })

  // Covers: US4-AS3, FR-064, spec §Edge Cases «La cuenta suspendida de un publicador, reactivada»
  it('suspender al publicador: «ya no está publicado», y reactivar no la reabre', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await sentBy(applicant, pet.code)

    const suspension = await suspend(publisher.id)
    expect(await rowOf(applicant.id, id)).toMatchObject({
      status: 'closed',
      close_reason: 'unpublished',
    })

    await lift(suspension)
    expect(await rowOf(applicant.id, id)).toMatchObject({ close_reason: 'unpublished' })
  })

  // Covers: US4-AS10, FR-082
  it('borrar la cuenta de quien solicitó borra sus solicitudes', async () => {
    const { pet } = await publisherWithPet()
    const applicant = await person(1)
    await sentBy(applicant, pet.code)

    const { error } = await serviceClient().auth.admin.deleteUser(applicant.id)
    expect(error).toBeNull()

    expect(await applicationsOf(applicant.id)).toEqual([])
  })
})

describeDb('lo que ya terminó no se toca', () => {
  // Covers: FR-052, FR-061
  it('ningún cierre cambia una retirada ni una cerrada', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const withdrawn = await insertApplication(applicant, pet, publisher, { status: 'withdrawn' })
    const closed = await insertApplication(applicant, pet, publisher, {
      status: 'closed',
      close_reason: 'suspended',
    })

    await block(publisher.id, applicant.id)
    await changed(publisher.id, pet.petId, 'mark_adopted')

    expect(await rowOf(applicant.id, withdrawn)).toMatchObject({
      status: 'withdrawn',
      close_reason: null,
    })
    expect(await rowOf(applicant.id, closed)).toMatchObject({
      status: 'closed',
      close_reason: 'suspended',
    })
  })

  // Covers: FR-061 (el trigger forward-only)
  it('una cerrada no vuelve a enviada ni cambia de motivo', async () => {
    const { publisher, pet } = await publisherWithPet()
    const applicant = await person(1)
    const id = await insertApplication(applicant, pet, publisher, {
      status: 'closed',
      close_reason: 'adopted',
    })

    const reopen = await db()
      .from('applications')
      .update({ status: 'sent', close_reason: null })
      .eq('id', id)
    expect(reopen.error?.message).toBe('application_final')

    const relabel = await db()
      .from('applications')
      .update({ close_reason: 'unpublished' })
      .eq('id', id)
    expect(relabel.error?.message).toBe('application_final')
  })
})
