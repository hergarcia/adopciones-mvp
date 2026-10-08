// La privacidad de responder (historia #65, FR-081, SC-002, SC-003): el contacto lo lee solo la otra
// persona de una solicitud aceptada; las lecturas del publicador no traen nada ajeno; quien solicitó
// no alcanza lo que es solo del publicador por ningún camino; nadie lee un número que ya no tiene.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import {
  contactAs,
  inboxAs,
  markAccepted,
  petApplicationsAs,
  publisherViewAs,
  responsePeople,
  revoke,
  verifiedNumberOf,
} from './application-responses-support'
import { insertApplication } from './applications-support'
import { setState } from './lifecycle-support'
import { setPhone } from './listing-support'
import { block, suspend } from './moderation-support'
import { db } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, scene } = responsePeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('el contacto se lee solo aceptada, y solo la otra persona', () => {
  // Covers: US1-AS7, FR-012, SC-002
  it('esperando respuesta, ninguna de las dos lee el contacto de la otra', async () => {
    const { publisher, applicant, id } = await scene()
    expect(await contactAs(publisher.client, id)).toEqual({ rows: [], error: null })
    expect(await contactAs(applicant.client, id)).toEqual({ rows: [], error: null })
  })

  // Covers: US1-AS3, FR-012, FR-013, FR-083
  it('aceptada, cada una lee el nombre y el teléfono verificado de hoy de la otra', async () => {
    const { publisher, applicant, id } = await scene()
    await markAccepted(id)

    const mine = await contactAs(applicant.client, id)
    expect(mine.error).toBeNull()
    expect(mine.rows).toEqual([
      {
        name: 'Quien publica',
        phone: await verifiedNumberOf(publisher.id),
        side: 'applicant',
        viewer_name: 'Quien solicita',
        pet_name: 'Tobi',
      },
    ])
    const theirs = await contactAs(publisher.client, id)
    expect(theirs.rows).toEqual([
      {
        name: 'Quien solicita',
        phone: await verifiedNumberOf(applicant.id),
        side: 'publisher',
        viewer_name: 'Quien publica',
        pet_name: 'Tobi',
      },
    ])
  })

  // Covers: US1-AS6, FR-015
  it('otra solicitante aceptada del mismo animal lee el del publicador, nunca el de la primera', async () => {
    const { publisher, pet, applicant, id } = await scene()
    const second = await person(1, 'Otra solicitante')
    const secondId = await insertApplication(second, pet, publisher)
    await markAccepted(id)
    await markAccepted(secondId)

    expect(await contactAs(second.client, id)).toEqual({ rows: [], error: null })
    const own = await contactAs(second.client, secondId)
    expect(own.rows.map((row) => row.name)).toEqual(['Quien publica'])
    expect(own.rows.map((row) => row.phone)).not.toContain(await verifiedNumberOf(applicant.id))
  })

  // Covers: FR-081, SC-002 (quien administra, otra persona, sin sesión)
  it('quien administra, otra persona y un visitante no leen el contacto', async () => {
    const { id } = await scene()
    await markAccepted(id)
    const moderator = await admin()
    const other = await person(2, 'Otra persona')
    for (const client of [moderator.client, other.client, anonClient()]) {
      // oxlint-disable-next-line no-await-in-loop -- tres sesiones, de a una
      const read = await contactAs(client, id)
      expect(read.rows).toEqual([])
    }
  })

  // Covers: US1-AS14, FR-013, SC-004
  it('con un cambio a medias o con el número perdido, el teléfono es nulo; el nuevo se lee', async () => {
    const { publisher, applicant, id } = await scene()
    await markAccepted(id)

    await setPhone(publisher.id, 'change_pending')
    expect((await contactAs(applicant.client, id)).rows[0]).toMatchObject({
      name: 'Quien publica',
      phone: null,
    })
    await setPhone(publisher.id, 'lost')
    expect((await contactAs(applicant.client, id)).rows[0]?.phone).toBeNull()
    const fresh = await setPhone(publisher.id, 'level_one')
    expect((await contactAs(applicant.client, id)).rows[0]?.phone).toBe(fresh)
  })

  // Covers: FR-018 (cerrada por adopción estando aceptada sí; cerrada sin haber aceptado, no)
  it('cerrada por adopción estando aceptada se sigue leyendo; esperando, no', async () => {
    const accepted = await scene()
    await markAccepted(accepted.id)
    await db()
      .from('pets')
      .update({ status: 'adopted', expires_at: null })
      .eq('id', accepted.pet.petId)
    expect((await contactAs(accepted.applicant.client, accepted.id)).rows).toHaveLength(1)

    const waiting = await scene()
    await db()
      .from('pets')
      .update({ status: 'adopted', expires_at: null })
      .eq('id', waiting.pet.petId)
    expect((await contactAs(waiting.applicant.client, waiting.id)).rows).toEqual([])
  })

  // Covers: FR-041, US4-AS5 (retirar cierra el contacto para las dos)
  it('retirada después de aceptar, ya no se lee', async () => {
    const { publisher, applicant, id } = await scene()
    await markAccepted(id)
    await db().from('applications').update({ status: 'withdrawn' }).eq('id', id)
    expect((await contactAs(applicant.client, id)).rows).toEqual([])
    expect((await contactAs(publisher.client, id)).rows).toEqual([])
  })

  // Covers: US2-AS5, FR-024 (dejar sin efecto cierra el contacto para las dos)
  it('dejada sin efecto, ninguna de las dos lee más el teléfono de la otra', async () => {
    const { publisher, applicant, id } = await scene()
    await markAccepted(id)
    expect((await contactAs(applicant.client, id)).rows).toHaveLength(1)

    expect((await revoke(publisher, id, 'not_concluded')).outcome).toBe('rejected')
    expect(await contactAs(applicant.client, id)).toEqual({ rows: [], error: null })
    expect(await contactAs(publisher.client, id)).toEqual({ rows: [], error: null })
  })
})

describeDb('lo que cambia con el animal y las personas cierra el contacto (US4)', () => {
  // Covers: US4-AS1, FR-018, FR-040 (solo la adopción lo conserva)
  it('aceptada y después borrada o dada de baja, ninguna de las dos lee más el contacto', async () => {
    const deleted = await scene()
    await markAccepted(deleted.id)
    const removed = await db().from('pets').delete().eq('id', deleted.pet.petId)
    expect(removed.error).toBeNull()

    const takenDown = await scene()
    await markAccepted(takenDown.id)
    await setState(takenDown.pet.petId, 'taken_down')

    for (const { publisher, applicant, id } of [deleted, takenDown]) {
      // oxlint-disable-next-line no-await-in-loop -- dos solicitudes, de a una
      const [mine, theirs] = await Promise.all([
        contactAs(applicant.client, id),
        contactAs(publisher.client, id),
      ])
      expect(mine).toEqual({ rows: [], error: null })
      expect(theirs).toEqual({ rows: [], error: null })
    }
  })

  // Covers: US4-AS5, FR-041 (bloqueo en las dos direcciones, suspensión de cada lado)
  it('aceptada, un bloqueo de cualquiera de las dos o una suspensión de cualquiera cierran el contacto', async () => {
    const scenes = await Promise.all([scene(), scene(), scene(), scene()])
    await Promise.all(scenes.map(({ id }) => markAccepted(id)))
    const [byApplicant, byPublisher, applicantSuspended, publisherSuspended] = scenes
    await block(byApplicant.applicant.id, byApplicant.publisher.id)
    await block(byPublisher.publisher.id, byPublisher.applicant.id)
    await suspend(applicantSuspended.applicant.id)
    await suspend(publisherSuspended.publisher.id)

    for (const { publisher, applicant, id } of scenes) {
      // oxlint-disable-next-line no-await-in-loop -- cuatro solicitudes, de a una
      const [mine, theirs] = await Promise.all([
        contactAs(applicant.client, id),
        contactAs(publisher.client, id),
      ])
      expect(mine.rows).toEqual([])
      expect(theirs.rows).toEqual([])
    }
  })

  // Covers: US4-AS2, FR-043 (un animal borrado o dado de baja: el nombre que tenía, nada de la persona)
  it('de un animal borrado o dado de baja, el publicador lee el cierre sin el perfil ni las respuestas', async () => {
    const deleted = await scene()
    const removed = await db().from('pets').delete().eq('id', deleted.pet.petId)
    expect(removed.error).toBeNull()
    const takenDown = await scene()
    await setState(takenDown.pet.petId, 'taken_down')

    for (const { publisher, id } of [deleted, takenDown]) {
      // oxlint-disable-next-line no-await-in-loop -- dos solicitudes, de a una
      const { rows, error } = await publisherViewAs(publisher.client, id)
      expect(error).toBeNull()
      expect(rows).toMatchObject([
        {
          id,
          status: 'closed',
          publisher_close: 'unpublished',
          pet_id: null,
          pet_name: 'Tobi',
          applicant_public_id: null,
          applicant_name: null,
          applicant_avatar_path: null,
          applicant_department: null,
          applicant_locality: null,
          applicant_level: null,
          answers: null,
        },
      ])
    }
  })
})

describeDb('las lecturas del publicador son solo suyas', () => {
  // Covers: US1-AS10, FR-001
  it('otra persona, quien administra, quien solicitó y un visitante no leen la solicitud, la carpeta ni la bandeja', async () => {
    const { pet, applicant, id } = await scene()
    const other = await person(1, 'Otra publicadora')
    const moderator = await admin()
    for (const client of [other.client, moderator.client, applicant.client, anonClient()]) {
      // oxlint-disable-next-line no-await-in-loop -- cuatro sesiones, de a una
      const [single, folder, inbox] = await Promise.all([
        publisherViewAs(client, id),
        petApplicationsAs(client, pet.petId),
        inboxAs(client),
      ])
      expect(single.rows).toEqual([])
      expect(folder.rows).toEqual([])
      expect(inbox.rows.map((row) => row.pet_id)).not.toContain(pet.petId)
    }
  })

  // Covers: FR-004, FR-012 (el publicador lee el perfil de hoy y las respuestas, nunca el contacto)
  it('el publicador lee su solicitud y su carpeta sin teléfono ni correo de nadie', async () => {
    const { publisher, pet, applicant, id } = await scene()
    const [single, folder] = await Promise.all([
      publisherViewAs(publisher.client, id),
      petApplicationsAs(publisher.client, pet.petId),
    ])
    expect(single.rows).toMatchObject([
      { id, status: 'sent', applicant_name: 'Quien solicita', applicant_level: 1 },
    ])
    expect(folder.rows).toMatchObject([{ id, is_new: true, applicant_name: 'Quien solicita' }])
    const text = JSON.stringify([single.rows, folder.rows])
    expect(text).not.toContain(await verifiedNumberOf(applicant.id))
    expect(text).not.toContain(applicant.email)
  })

  // Covers: R2, FR-021, SC-003 (lo que es solo del publicador no tiene camino desde una sesión)
  it('nadie con sesión lee las tablas de respuestas, preguntas, bandeja de salida ni visitas', async () => {
    const { publisher, applicant, id } = await scene()
    await markAccepted(id)
    const { error } = await db()
      .from('application_notices')
      .insert({ kind: 'accepted', application_id: id, recipient_id: applicant.id })
    expect(error).toBeNull()
    const tables = [
      'application_reviews',
      'application_questions',
      'application_notices',
      'inbox_visits',
    ] as const
    for (const client of [applicant.client, publisher.client, anonClient()]) {
      for (const table of tables) {
        // oxlint-disable-next-line no-await-in-loop -- una tabla por vez
        const read = await client.from(table).select('*')
        expect(read.data ?? []).toEqual([])
      }
      // oxlint-disable-next-line no-await-in-loop -- idem
      const claim = await client.rpc('claim_application_notices', { p_limit: 10 })
      expect(claim.error).not.toBeNull()
    }
  })
})
