// El recordatorio y «Sigue disponible» en la base (historia #59, research R4 y R5): un recordatorio
// por vencimiento, cada vencida medida una vez, y un enlace que solo renueva ese animal, por 30 días,
// y que nadie lee desde el navegador. La base local solo tiene datos sintéticos.
import { afterEach, expect, it } from 'vitest'
import { RENEWAL_LINK_DAYS } from '../../src/lib/pets/rules'
import { hashRenewalToken, newRenewalToken } from '../../src/lib/pets/renewal-token'
import type { PetState } from '../../src/lib/pets/types'
import { describeDb } from '../setup/env-report'
import {
  LIFETIME_MS,
  changed,
  inDays,
  msFrom,
  petRow,
  setExpiry,
  setState,
} from './lifecycle-support'
import { listPet, publishers, sql } from './listing-support'
import { PENDING_TTL } from './pet-support'
import { db } from './phone-support'
import { anonClient, asNewUser, serviceClient, type SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const publisher = publishers(cleanups)
const DAY_MS = 86_400_000
const ALL = 100_000

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function petIn(ownerId: string, state: PetState) {
  const pet = await listPet(ownerId)
  await setState(pet.petId, state)
  return pet
}

async function claimedReminders(): Promise<string[]> {
  const { data, error } = await db().rpc('claim_pet_reminders', { p_limit: ALL })
  expect(error).toBeNull()
  return (data ?? []).map((row) => row.pet_id)
}

async function linkFor(petId: string): Promise<string> {
  const token = newRenewalToken()
  const { error } = await db().rpc('create_pet_renewal_link', {
    p_pet: petId,
    p_token_hash: hashRenewalToken(token),
  })
  expect(error).toBeNull()
  return hashRenewalToken(token)
}

async function renew(tokenHash: string) {
  const { data, error } = await db().rpc('renew_by_link', {
    p_token_hash: tokenHash,
    p_pending_ttl: PENDING_TTL,
  })
  expect(error).toBeNull()
  const row = data?.[0]
  if (row === undefined) throw new Error('renew_by_link no devolvió ninguna fila')
  return row
}

describeDb('el recordatorio', () => {
  // Covers: FR-017, SC-003, US3-AS1, US3-AS9
  it('sale una sola vez por vencimiento, con lo que lleva el correo', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'available')
    const expiresAt = inDays(6.9)
    await setExpiry(petId, expiresAt)

    const { data } = await db().rpc('claim_pet_reminders', { p_limit: ALL })
    const mine = (data ?? []).filter((row) => row.pet_id === petId)
    expect(mine).toHaveLength(1)
    expect(mine[0]).toMatchObject({ owner_id: owner.id, name: 'Luna', sex: 'female' })
    expect(msFrom(mine[0]?.expires_at, new Date(expiresAt).getTime())).toBe(0)
    expect(msFrom((await petRow(petId))?.reminder_sent_at, Date.now())).toBeLessThan(60_000)

    expect(await claimedReminders()).not.toContain(petId)
  })

  // Covers: FR-017, SC-003, US3-AS9
  it('renovar abre un vencimiento nuevo con su propio recordatorio, a 7 días de él', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'in_process')
    await setExpiry(petId, inDays(5))
    expect(await claimedReminders()).toContain(petId)

    await changed(owner.id, petId, 'renew')
    expect(await claimedReminders()).not.toContain(petId)

    await setExpiry(petId, inDays(6.9))
    expect(await claimedReminders()).toContain(petId)
  })

  // Covers: FR-017, SC-003
  it('ni antes de los 7 días, ni pausada, adoptada, vencida o dada de baja', async () => {
    const owner = await publisher()
    const early = await petIn(owner.id, 'available')
    await setExpiry(early.petId, inDays(7.1))
    const others = await Promise.all(
      (['paused', 'adopted', 'expired', 'taken_down'] as const).map((state) =>
        petIn(owner.id, state),
      ),
    )
    const takenDown = others[3]
    if (takenDown === undefined) throw new Error('falta la dada de baja')
    await setExpiry(takenDown.petId, inDays(3))

    const claimed = await claimedReminders()
    for (const { petId } of [early, ...others]) expect(claimed).not.toContain(petId)
  })

  // Covers: FR-032 (cada vencimiento se mide una vez)
  it('cada vencida se cuenta una sola vez, con su estado y su fecha de publicación', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'in_process')
    const publishedAt = inDays(-31)
    await db().from('pets').update({ published_at: publishedAt }).eq('id', petId)
    await setExpiry(petId, inDays(-1))
    const running = await petIn(owner.id, 'available')

    const first = await db().rpc('claim_pet_expiries', { p_limit: ALL })
    expect(first.error).toBeNull()
    expect((await petRow(petId))?.expiry_counted_at).not.toBeNull()
    expect((await petRow(running.petId))?.expiry_counted_at).toBeNull()
    const mine = (first.data ?? []).filter(
      (row) =>
        row.status === 'in_process' && msFrom(row.published_at, Date.parse(publishedAt)) === 0,
    )
    expect(mine).toHaveLength(1)

    const second = await db().rpc('claim_pet_expiries', { p_limit: ALL })
    expect(
      (second.data ?? []).filter((row) => msFrom(row.published_at, Date.parse(publishedAt)) === 0),
    ).toEqual([])
  })
})

describeDb('«Sigue disponible»', () => {
  // Covers: FR-018, SC-004, US3-AS1, US3-AS2, US3-AS8
  it.each(['available', 'in_process'] as const)(
    'renueva %s sin cambiar su estado: dos toques son 30 días desde el último',
    async (state) => {
      const owner = await publisher()
      const { petId } = await petIn(owner.id, state)
      await setExpiry(petId, inDays(6))
      const before = await petRow(petId)
      const link = await linkFor(petId)

      const first = await renew(link)
      const second = await renew(link)

      expect(first).toMatchObject({ outcome: 'renewed', pet_name: 'Luna', sex: 'female' })
      expect(second.outcome).toBe('renewed')
      expect(msFrom(second.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)
      const after = await petRow(petId)
      expect(after?.status).toBe(state)
      expect(after?.published_at).toBe(before?.published_at)
      expect(after?.reminder_sent_at).toBeNull()
    },
  )

  // Covers: FR-018, US3-AS3
  it('una vencida vuelve a publicarse disponible, como publicada hoy', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'expired')
    const link = await linkFor(petId)

    const row = await renew(link)

    expect(row.outcome).toBe('republished')
    expect(msFrom(row.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)
    const after = await petRow(petId)
    expect(after?.status).toBe('available')
    expect(msFrom(after?.published_at, Date.now())).toBeLessThan(60_000)
  })

  // Covers: FR-018, US3-AS4, US3-AS5
  it.each(['paused', 'adopted', 'taken_down'] as const)(
    '%s no cambia y dice cuál es su estado',
    async (state) => {
      const owner = await publisher()
      const { petId } = await petIn(owner.id, state)
      const before = await petRow(petId)
      const link = await linkFor(petId)

      expect(await renew(link)).toMatchObject({ outcome: state, pet_name: 'Luna', sex: 'female' })
      expect(await petRow(petId)).toEqual(before)
    },
  )

  // Covers: FR-018, US3-AS10
  it.each(['available', 'expired'] as const)(
    'sin el teléfono confirmado, %s no cambia',
    async (state) => {
      const owner = await publisher({ phone: 'change_pending' })
      const { petId } = await petIn(owner.id, state)
      const before = await petRow(petId)
      const link = await linkFor(petId)

      expect((await renew(link)).outcome).toBe('needs_verification')
      expect(await petRow(petId)).toEqual(before)
    },
  )

  // Covers: FR-019, US3-AS7
  it('un enlace inventado, vencido o de un animal borrado no sirve y nada cambia', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'available')
    await setExpiry(petId, inDays(6))
    const before = await petRow(petId)

    expect((await renew(hashRenewalToken(newRenewalToken()))).outcome).toBe('invalid')

    const stale = await linkFor(petId)
    await db()
      .from('pet_renewal_links')
      .update({ expires_at: inDays(-0.001) })
      .eq('token_hash', stale)
    expect((await renew(stale)).outcome).toBe('invalid')
    expect(await petRow(petId)).toEqual(before)

    const link = await linkFor(petId)
    await serviceClient().rpc('delete_pet', { p_owner: owner.id, p_pet: petId })
    const links = await db().from('pet_renewal_links').select('token_hash').eq('pet_id', petId)
    expect(links.data).toEqual([])
    expect(await renew(link)).toEqual({
      outcome: 'invalid',
      pet_name: null,
      sex: null,
      expires_at: null,
    })
  })

  // Covers: FR-019 (solo ese animal)
  it('nunca toca otro animal, ni de la misma persona', async () => {
    const owner = await publisher()
    const target = await petIn(owner.id, 'available')
    const other = await petIn(owner.id, 'available')
    await setExpiry(other.petId, inDays(6))
    const before = await petRow(other.petId)

    expect((await renew(await linkFor(target.petId))).outcome).toBe('renewed')
    expect(await petRow(other.petId)).toEqual(before)
  })

  // Covers: FR-019, FR-020 (lo que muestra la pantalla de resultado)
  it('la pantalla lee nombre, estado, vencimiento y la portada, y nada si el enlace no sirve', async () => {
    const owner = await publisher()
    const { petId, photoIds } = await petIn(owner.id, 'in_process')
    const link = await linkFor(petId)
    const stored = await petRow(petId)

    const view = await db().rpc('renewal_link_view', { p_token_hash: link })
    expect(view.data).toEqual([
      {
        name: 'Luna',
        sex: 'female',
        state: 'in_process',
        expires_at: stored?.expires_at,
        cover_id: photoIds[0],
        cover_owner: owner.id,
      },
    ])
    const none = await db().rpc('renewal_link_view', {
      p_token_hash: hashRenewalToken(newRenewalToken()),
    })
    expect(none.data).toEqual([])
  })

  // Covers: FR-019 (research R5: 30 días desde enviado el correo)
  it('el enlace dura RENEWAL_LINK_DAYS días desde que se crea', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'available')
    const link = await linkFor(petId)

    const { data } = await db()
      .from('pet_renewal_links')
      .select('expires_at')
      .eq('token_hash', link)
    expect(msFrom(data?.[0]?.expires_at, Date.now() + RENEWAL_LINK_DAYS * DAY_MS)).toBeLessThan(
      60_000,
    )
    const [parity] = await sql<{ same: boolean }>(
      `select private.pet_renewal_link_lifetime() = interval '${RENEWAL_LINK_DAYS} days' as same`,
    )
    expect(parity).toEqual({ same: true })
  })
})

describeDb('desde el navegador', () => {
  // Covers: FR-019, FR-020, SC-006 (nadie lee los enlaces ni llama a las funciones)
  it('ni anónimo ni con sesión leen los enlaces ni llaman a las funciones', async () => {
    const owner = await publisher()
    const { petId } = await petIn(owner.id, 'available')
    const link = await linkFor(petId)
    const user = await asNewUser()
    cleanups.push(user.cleanup)

    for (const client of [anonClient(), user.client]) {
      // oxlint-disable-next-line no-await-in-loop
      const read = await client.from('pet_renewal_links').select('token_hash')
      expect(read.error?.code).toBe('42501')
      const calls = [
        client.rpc('claim_pet_reminders', { p_limit: 1 }),
        client.rpc('claim_pet_expiries', { p_limit: 1 }),
        client.rpc('create_pet_renewal_link', { p_pet: petId, p_token_hash: link }),
        client.rpc('renew_by_link', { p_token_hash: link, p_pending_ttl: PENDING_TTL }),
        client.rpc('renewal_link_view', { p_token_hash: link }),
        client.rpc('pet_lifecycle_tick'),
      ]
      // oxlint-disable-next-line no-await-in-loop
      for (const { error } of await Promise.all(calls)) expect(error?.code).toBe('42501')
    }
  })
})
