// La privacidad del pedido de identidad (historia #257, FR-012, FR-030, SC-005): la tabla no se lee
// ni se escribe por ningún rol, las lecturas de quien publicó no traen nada ajeno ni nada del pedido
// de verificación de la otra persona, quien administra no ve el pedido, y se borra con cualquiera de
// las dos cuentas.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { petApplicationsAs, publisherViewAs } from './application-responses-support'
import {
  askIdentity,
  askPeople,
  askRowOf,
  asksTableAs,
  insertAsk,
  myApplicationAs,
} from './identity-asks-support'
import { makeExpired, openRequest, resolve } from './identity-support'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin, asking } = askPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

describeDb('la tabla del pedido', () => {
  // Covers: FR-030 (nadie la lee directo: solo las funciones que eligen columnas)
  it('no la lee nadie: visitante, quien solicitó, quien publicó ni quien administra', async () => {
    const { publisher, applicant, id } = await asking()
    await askIdentity(publisher, id)
    const reviewer = await admin()

    for (const client of [anonClient(), applicant.client, publisher.client, reviewer.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const { rows } = await asksTableAs(client)
      expect(rows).toEqual([])
    }
  })

  // Covers: FR-008, FR-030 (ni quien publicó escribe el pedido sin pasar por la función)
  it('no la escribe nadie', async () => {
    const { publisher, applicant, id } = await asking()
    const reviewer = await admin()

    for (const client of [anonClient(), applicant.client, publisher.client, reviewer.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const { error } = await client
        .from('application_identity_asks')
        .insert({ application_id: id })
      expect(error).not.toBeNull()
    }
    await insertAsk(id)
    for (const client of [publisher.client, reviewer.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      await client
        .from('application_identity_asks')
        .update({ resolved_at: new Date().toISOString() })
        .eq('application_id', id)
      // oxlint-disable-next-line no-await-in-loop -- idem
      await client.from('application_identity_asks').delete().eq('application_id', id)
    }
    expect(await askRowOf(id)).toMatchObject({ application_id: id, resolved_at: null })
  })

  // Covers: FR-008 (pedir pasa solo por la acción, con el id de la sesión)
  it('`ask_identity` no se llama sin el rol de servicio', async () => {
    const { publisher, id } = await asking()
    for (const client of [anonClient(), publisher.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const { error } = await client.rpc('ask_identity', { p_publisher: publisher.id, p_id: id })
      expect(error).not.toBeNull()
    }
    expect(await askRowOf(id)).toBeNull()
  })
})

describeDb('lo que lee quien publicó', () => {
  // Covers: US1-AS9, FR-008
  it('de un animal ajeno no trae nada, aunque tenga pedido', async () => {
    const { publisher, pet, id } = await asking()
    await askIdentity(publisher, id)
    const other = await person(2, 'Otra rescatista')
    expect(await publisherViewAs(other.client, id)).toEqual({ rows: [], error: null })
    expect(await petApplicationsAs(other.client, pet.petId)).toEqual({ rows: [], error: null })
  })

  // Covers: FR-012, SC-005 (en revisión, rechazado o vencido se ve igual que sin pedido de verificación)
  it('nada del pedido de verificación de quien solicitó: ni el estado, ni el motivo, ni las fechas', async () => {
    const { publisher, applicant, id } = await asking()
    await askIdentity(publisher, id)
    const reviewer = await admin()
    const read = async () => (await publisherViewAs(publisher.client, id)).rows

    const none = await read()
    expect(none).toHaveLength(1)
    expect(none[0]).toMatchObject({
      applicant_identity_verified: false,
      identity_resolved_at: null,
    })

    const rejectedRequest = await openRequest(applicant.id)
    expect(await read()).toEqual(none)
    await resolve(rejectedRequest, reviewer.id, 'reject', 'unreadable')
    expect(await read()).toEqual(none)

    const expiring = await openRequest(applicant.id)
    await makeExpired(expiring)
    expect(await read()).toEqual(none)
  })

  // Covers: FR-012 (la única señal es la identidad aprobada, que esconde el botón)
  it('las columnas nuevas son el pedido con sus dos días y si tiene la identidad aprobada', async () => {
    const { publisher, id } = await asking()
    const [row] = (await publisherViewAs(publisher.client, id)).rows
    const keys = Object.keys(Object(row))
    expect(keys.filter((key) => key.includes('identity'))).toEqual([
      'identity_asked_at',
      'identity_resolved_at',
      'applicant_identity_verified',
    ])
  })
})

describeDb('quien administra no ve el pedido', () => {
  // Covers: FR-030, spec §Edge Cases «La revisión de quien administra»
  // Los números de la portada y la búsqueda son de todas las cuentas: los cambian las otras pruebas
  // que corren a la vez, y no traen nada de una solicitud.
  it('la ficha de la persona y su pedido de verificación en la cola no cambian con un pedido', async () => {
    const { publisher, applicant, id } = await asking()
    await openRequest(applicant.id)
    const reviewer = await admin()
    const read = async () =>
      Promise.all([
        reviewer.client.rpc('admin_person_record', { p_public_id: applicant.publicId }),
        reviewer.client.from('identity_requests').select('*').eq('user_id', applicant.id),
      ]).then((results) => results.map(({ data, error }) => ({ data, error })))

    const before = await read()
    expect(before.map(({ error }) => error)).toEqual([null, null])
    expect((await askIdentity(publisher, id)).outcome).toBe('asked')
    expect(await read()).toEqual(before)
    expect(JSON.stringify(before)).not.toContain('identity_ask')
  })
})

describeDb('se borra con cualquiera de las dos cuentas', () => {
  // Covers: FR-030, R11 (cascada de la solicitud)
  it('al borrar la cuenta de quien solicitó', async () => {
    const { publisher, applicant, id } = await asking()
    await askIdentity(publisher, id)
    const { error } = await serviceClient().auth.admin.deleteUser(applicant.id)
    expect(error).toBeNull()
    expect(await askRowOf(id)).toBeNull()
  })

  // Covers: FR-030, R11 (la solicitud queda para quien la mandó; el pedido, no)
  it('al borrar la cuenta de quien publicó', async () => {
    const { publisher, id } = await asking()
    await askIdentity(publisher, id)
    const { error } = await serviceClient().auth.admin.deleteUser(publisher.id)
    expect(error).toBeNull()
    const { data } = await db().from('applications').select('id').eq('id', id)
    expect(data).toEqual([{ id }])
    expect(await askRowOf(id)).toBeNull()
  })
})

describeDb('Mi solicitud de otra persona', () => {
  // Covers: US2-AS1, FR-023, FR-030 (el pedido lo ve solo quien solicitó en su solicitud)
  it('no trae nada a quien publicó, a otra persona ni a quien administra', async () => {
    const { publisher, applicant, id } = await asking()
    await askIdentity(publisher, id)
    const other = await person(1, 'Otra persona')
    const reviewer = await admin()

    for (const client of [anonClient(), publisher.client, other.client, reviewer.client]) {
      // oxlint-disable-next-line no-await-in-loop -- un rol por vez
      const { rows } = await myApplicationAs(client, id)
      expect(rows).toEqual([])
    }
    expect((await myApplicationAs(applicant.client, id)).rows[0]?.identity_asked).toBe(true)
  })
})
