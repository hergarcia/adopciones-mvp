// Lo que esta historia junta de una persona lo ve solo quien administra, y solo por sus funciones
// (historia #73, FR-071): cada regla de visibilidad se demuestra con un intento que falla, sin
// sesión, como una persona y como quien administra estando suspendida.
import { afterEach, expect, it } from 'vitest'
import { describeDb } from '../setup/env-report'
import { pendingIdentity, pendingPet, pendingReport } from './admin-support'
import { addRejections } from './identity-support'
import { webp } from './pet-support'
import { lift, moderationPeople, suspend, type Person } from './moderation-support'
import { db } from './phone-support'
import { anonClient, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = moderationPeople(cleanups)

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

type Client = SyntheticUser['client']

/** Lo que cada función de lectura le devuelve a esa sesión. */
async function readsOf(client: Client, target: Person) {
  const [queue, total, recent, record, search] = await Promise.all([
    client.rpc('admin_queue_count', { p_queue: 'reports' }),
    client.rpc('admin_pending_total'),
    client.rpc('admin_recent_counts'),
    client.rpc('admin_person_record', { p_public_id: target.publicId }),
    client.rpc('admin_search_people', { p_query: 'Bruno', p_limit: 20 }),
  ])
  return { queue, total, recent, record, search }
}

async function withAvatar(target: Person): Promise<string> {
  const path = `${target.id}/avatar.webp`
  const uploaded = await serviceClient()
    .storage.from('avatars')
    .upload(path, webp(), { contentType: 'image/webp', upsert: true })
  expect(uploaded.error).toBeNull()
  const { error } = await db().from('profiles').update({ avatar_path: path }).eq('id', target.id)
  expect(error).toBeNull()
  return path
}

describeDb('lo que lee Administrar, para quien no administra', () => {
  // Covers: FR-001, FR-071 (sin sesión no se puede ni llamar)
  it('sin sesión, ninguna de las cinco lecturas se puede llamar', async () => {
    const bruno = await person(1, 'Bruno')
    const reads = await readsOf(anonClient(), bruno)
    for (const read of Object.values(reads)) {
      expect(read.error?.code).toBe('42501')
      expect(read.data).toBeNull()
    }
  })

  // Covers: FR-001, FR-071, US1-AS11
  it('una persona con sesión no lee nada, aunque haya algo esperando', async () => {
    const bruno = await person(1, 'Bruno')
    const ana = await person(1, 'Ana')
    await pendingReport(ana, bruno)
    const reads = await readsOf(ana.client, bruno)

    expect(reads.queue).toMatchObject({ error: null, data: [] })
    expect(reads.total).toMatchObject({ error: null, data: null })
    expect(reads.recent).toMatchObject({ error: null, data: [] })
    expect(reads.record).toMatchObject({ error: null, data: [] })
    expect(reads.search).toMatchObject({ error: null, data: [] })
  })

  // Covers: FR-002
  it('quien administra y está suspendida no lee nada; al reactivarla, vuelve', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    await pendingReport(lucia, bruno)
    const suspension = await suspend(lucia.id)
    const reads = await readsOf(lucia.client, bruno)

    expect(reads.queue).toMatchObject({ error: null, data: [] })
    expect(reads.total).toMatchObject({ error: null, data: null })
    expect(reads.recent).toMatchObject({ error: null, data: [] })
    expect(reads.record).toMatchObject({ error: null, data: [] })
    expect(reads.search).toMatchObject({ error: null, data: [] })

    await lift(suspension)
    const back = await readsOf(lucia.client, bruno)
    expect(back.queue.data).toHaveLength(1)
    expect(back.total.data).toEqual(expect.any(Number))
    expect(back.record.data).toHaveLength(1)
  })
})

describeDb('el resumen, para cualquier sesión', () => {
  // Covers: FR-072 (solo la tarea reclama y llama)
  it('ni sin sesión ni con sesión se reclama el resumen ni se dispara la tarea', async () => {
    const lucia = await admin('Lucía')
    for (const client of [anonClient(), lucia.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const [claim, tick] = await Promise.all([
        client.rpc('claim_admin_digests'),
        client.rpc('admin_digest_tick'),
      ])
      expect(claim.error?.code).toBe('42501')
      expect(tick.error?.code).toBe('42501')
    }
  })

  it('los envíos del resumen no se leen ni se escriben con ninguna sesión', async () => {
    const lucia = await admin('Lucía')
    for (const client of [anonClient(), lucia.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const [read, write] = await Promise.all([
        client.from('admin_digest_sends').select('*'),
        client.from('admin_digest_sends').insert({ user_id: lucia.id, day: '2026-10-09' }),
      ])
      expect(read.error?.code).toBe('42501')
      expect(write.error?.code).toBe('42501')
    }
  })
})

describeDb('la ficha de una persona', () => {
  // Covers: FR-031 a FR-037, FR-070 (exactamente lo que la ficha deja ver)
  it('trae solo las claves de la ficha: nada del teléfono, el correo, las imágenes ni quién reportó', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    const ana = await person(1, 'Ana')
    await pendingIdentity(bruno)
    await addRejections(bruno.id, 3)
    await pendingPet(bruno, 'Luna')
    await pendingReport(ana, bruno)
    const suspension = await suspend(bruno.id, lucia.id)
    await lift(suspension)
    await suspend(bruno.id, lucia.id)

    const { data, error } = await lucia.client.rpc('admin_person_record', {
      p_public_id: bruno.publicId,
    })
    expect(error).toBeNull()
    const row = data?.[0]
    const keys = (value: unknown) => Object.keys(Object(value)).sort()
    const first = (value: unknown): unknown => (Array.isArray(value) ? value[0] : null)

    expect(keys(row)).toEqual(['identity', 'person', 'pets', 'reports', 'suspensions'])
    expect(keys(row?.person)).toEqual([
      'avatar_path',
      'created_at',
      'department',
      'display_name',
      'is_self',
      'level',
      'locality',
      'public_id',
      'suspension',
    ])
    expect(keys(Reflect.get(Object(row?.person), 'suspension'))).toEqual([
      'id',
      'reason',
      'suspended_at',
      'suspended_by_name',
    ])
    expect(keys(row?.identity)).toEqual(['expired_on', 'open', 'rejections', 'verified_on'])
    expect(keys(Reflect.get(Object(row?.identity), 'open'))).toEqual(['id', 'is_own', 'sent_at'])
    expect(keys(first(Reflect.get(Object(row?.identity), 'rejections')))).toEqual([
      'reason',
      'rejected_on',
    ])
    expect(keys(row?.reports)).toEqual(['items', 'own_open'])
    expect(keys(first(Reflect.get(Object(row?.reports), 'items')))).toEqual([
      'created_at',
      'details',
      'reason',
      'resolution',
      'resolved_at',
    ])
    expect(keys(first(row?.suspensions))).toEqual([
      'lifted_at',
      'lifted_by_name',
      'reason',
      'suspended_at',
      'suspended_by_name',
    ])
    expect(keys(first(row?.pets))).toEqual([
      'code',
      'name',
      'pending_review',
      'published_at',
      'state',
      'takedown_reason',
    ])
    const text = JSON.stringify(row)
    expect(text).not.toContain(bruno.email)
    expect(text).not.toContain(bruno.id)
    expect(text).not.toContain(ana.id)
    expect(text).not.toContain(ana.publicId)
  })

  // Covers: US2-AS6, spec §Edge Cases (la propia ficha no ve los reportes sobre sí)
  it('en la propia ficha, de los reportes sobre quien mira solo cuántos esperan', async () => {
    const lucia = await admin('Lucía')
    const bruno = await person(1, 'Bruno')
    await pendingReport(bruno, lucia)

    const { data, error } = await lucia.client.rpc('admin_person_record', {
      p_public_id: lucia.publicId,
    })
    expect(error).toBeNull()
    expect(data?.[0]?.reports).toEqual({ own_open: 1, items: [] })
    expect(Reflect.get(Object(data?.[0]?.person), 'is_self')).toBe(true)
  })
})

describeDb('la foto de perfil', () => {
  // Covers: FR-031, research R10 (quien administra firma una foto ajena; una persona no)
  it('quien administra firma la foto de cualquiera; una persona, no la de otra', async () => {
    const lucia = await admin('Lucía')
    const ana = await person(1, 'Ana')
    const bruno = await person(1, 'Bruno')
    const path = await withAvatar(bruno)

    const signed = await lucia.client.storage.from('avatars').createSignedUrl(path, 60)
    expect(signed.error).toBeNull()
    expect(signed.data?.signedUrl).toEqual(expect.any(String))

    const denied = await ana.client.storage.from('avatars').createSignedUrl(path, 60)
    expect(denied.data).toBeNull()
    expect(denied.error).not.toBeNull()

    await serviceClient().storage.from('avatars').remove([path])
  })
})
