// Los avisos de una persona los ve y los borra solo ella (historia #265, FR-032, SC-004, research
// R13). Cada prueba lo intenta como quien no debe: un visitante, otra persona y quien administra.
// La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { hashLinkToken, newLinkToken } from '../../src/lib/links/link-token'
import { describeDb } from '../setup/env-report'
import { moderationPeople } from './moderation-support'
import { alertFor, alertsOf, sendsOf } from './pet-alerts-support'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = moderationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function brunoWithAlert() {
  const bruno = await person(1, 'Bruno')
  await alertFor(bruno.client, { species: ['dog'], size: ['small'], department: ['UY-MO'] })
  const [alert] = await alertsOf(bruno.id)
  if (alert === undefined) throw new Error('no se creó el aviso de prueba')
  return { bruno, alertId: alert.id }
}

describeDb('los avisos son de su dueña (FR-032, SC-004)', () => {
  // Covers: FR-032, SC-004 (un visitante)
  it('un visitante no los lee ni los borra', async () => {
    const { bruno, alertId } = await brunoWithAlert()
    const anon = anonClient()

    const read = await anon.from('pet_alerts').select('*')
    expect(read.error?.code).toBe('42501')
    const removed = await anon.from('pet_alerts').delete().eq('id', alertId)
    expect(removed.error?.code).toBe('42501')
    expect(await alertsOf(bruno.id)).toHaveLength(1)
  })

  // Covers: FR-032, FR-033, SC-004 (otra persona y quien administra)
  it.each(['otra persona', 'quien administra'] as const)(
    '%s no los lee ni los borra',
    async (who) => {
      const { bruno, alertId } = await brunoWithAlert()
      const other = who === 'otra persona' ? await person(1, 'Ana') : await admin()

      const read = await other.client.from('pet_alerts').select('*').eq('user_id', bruno.id)
      expect(read.error).toBeNull()
      expect(read.data).toEqual([])
      const removed = await other.client.from('pet_alerts').delete().eq('id', alertId).select('id')
      expect(removed.data).toEqual([])
      expect(await alertsOf(bruno.id)).toHaveLength(1)
    },
  )

  // Covers: FR-032, US1-AS10 (la dueña lee y borra lo suyo)
  it('la dueña lee y borra los suyos', async () => {
    const { bruno, alertId } = await brunoWithAlert()

    const read = await bruno.client.from('pet_alerts').select('id, species, sizes, departments')
    expect(read.data).toEqual([
      { id: alertId, species: ['dog'], sizes: ['small'], departments: ['UY-MO'] },
    ])
    const removed = await bruno.client.from('pet_alerts').delete().eq('id', alertId).select('id')
    expect(removed.data).toEqual([{ id: alertId }])
    expect(await alertsOf(bruno.id)).toEqual([])
  })

  // Covers: FR-006, FR-007 (crear entra solo por la función, que cuenta el tope)
  it('la dueña no inserta ni cambia directo', async () => {
    const { bruno, alertId } = await brunoWithAlert()

    const inserted = await bruno.client.from('pet_alerts').insert({ user_id: bruno.id })
    expect(inserted.error?.code).toBe('42501')
    const updated = await bruno.client
      .from('pet_alerts')
      .update({ covered_until: new Date(Date.UTC(2999, 0, 1)).toISOString() })
      .eq('id', alertId)
    expect(updated.error?.code).toBe('42501')
  })
})

describeDb('lo del correo no se lee con la API (R13)', () => {
  // Covers: FR-030, FR-031 (los envíos y los enlaces de baja)
  it.each(['pet_alert_sends', 'pet_alert_unsubscribe_links'] as const)(
    '%s: ni un visitante ni una persona con sesión',
    async (table) => {
      const bruno = await person(1, 'Bruno')
      for (const client of [anonClient(), bruno.client]) {
        // oxlint-disable-next-line no-await-in-loop
        const { error } = await client.from(table).select('*')
        expect(error?.code).toBe('42501')
      }
    },
  )

  const HASH = hashLinkToken(newLinkToken())
  const CALLS = [
    ['claim_pet_alert_mail', {}],
    ['mark_pet_alerts_mailed', { p_user: crypto.randomUUID(), p_run_at: new Date().toISOString() }],
    ['create_pet_alert_unsubscribe_link', { p_user: crypto.randomUUID(), p_token_hash: HASH }],
    ['pet_alert_unsubscribe_link_exists', { p_token_hash: HASH }],
    ['unsubscribe_pet_alerts', { p_token_hash: HASH }],
  ] as const

  // Covers: FR-030, SC-005 (la corrida y la baja corren solo en el servidor)
  it.each(CALLS)('%s: ni un visitante ni una persona con sesión', async (name, args) => {
    const bruno = await person(1, 'Bruno')
    for (const client of [anonClient(), bruno.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const { error } = await client.rpc(name, args)
      expect(error?.code).toBe('42501')
    }
  })
})

describeDb('borrar la cuenta borra los avisos (FR-034)', () => {
  // Covers: FR-034, Edge Cases «Borrar la cuenta»
  it('se van los avisos, los envíos y los enlaces de baja', async () => {
    const { bruno } = await brunoWithAlert()
    const service = serviceClient()
    const sent = await db().from('pet_alert_sends').insert({ user_id: bruno.id, day: '2026-10-29' })
    expect(sent.error).toBeNull()
    const linked = await service.rpc('create_pet_alert_unsubscribe_link', {
      p_user: bruno.id,
      p_token_hash: hashLinkToken(newLinkToken()),
    })
    expect(linked.error).toBeNull()

    expect((await service.auth.admin.deleteUser(bruno.id)).error).toBeNull()

    expect(await alertsOf(bruno.id)).toEqual([])
    expect(await sendsOf(bruno.id)).toEqual([])
    const links = await db().from('pet_alert_unsubscribe_links').select('*').eq('user_id', bruno.id)
    expect(links.data).toEqual([])
  })
})
