// El recordatorio y «Sigue disponible» de una camada (historia #206, research R5): un solo correo por
// camada y ninguno por cría, un enlace que renueva o vuelve a publicar la camada entera con las reglas
// de un animal para cada estado, y la reactivación de una cuenta que corre su vencimiento.
import { afterEach, expect, it } from 'vitest'
import { hashRenewalToken, newRenewalToken } from '../../src/lib/pets/renewal-token'
import { describeDb } from '../setup/env-report'
import { markAdopted } from './adoptions-support'
import { applicationPeople } from './applications-support'
import { LIFETIME_MS, inDays, msFrom } from './lifecycle-support'
import {
  changeLitter,
  expireLitter,
  litterRow,
  litterWithYoung,
  pauseLitter,
  youngOf,
} from './litter-support'
import { setPhone, sql } from './listing-support'
import { reactivateAs, suspend } from './moderation-support'
import { PENDING_TTL } from './pet-support'
import { db } from './phone-support'
import type { SyntheticUser } from './roles'

const cleanups: SyntheticUser['cleanup'][] = []
const { person, admin } = applicationPeople(cleanups)
const ALL = 100_000

afterEach(async () => {
  const pending = cleanups.splice(0)
  await Promise.all(pending.map((cleanup) => cleanup()))
})

async function scene(count = 2) {
  const publisher = await person(1, 'Quien publica')
  const litter = await litterWithYoung(publisher.id, count)
  return { publisher, litter }
}

async function setLitterExpiry(litterId: string, expiresAt: string) {
  const { error } = await db().from('litters').update({ expires_at: expiresAt }).eq('id', litterId)
  expect(error).toBeNull()
}

async function claimedLitters(): Promise<string[]> {
  const { data, error } = await db().rpc('claim_litter_reminders', { p_limit: ALL })
  expect(error).toBeNull()
  return (data ?? []).map((row) => row.litter_id)
}

async function linkFor(litterId: string): Promise<string> {
  const tokenHash = hashRenewalToken(newRenewalToken())
  const { error } = await db().rpc('create_litter_renewal_link', {
    p_litter: litterId,
    p_token_hash: tokenHash,
  })
  expect(error).toBeNull()
  return tokenHash
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

async function viewOf(tokenHash: string) {
  const { data, error } = await db().rpc('renewal_link_view', { p_token_hash: tokenHash })
  expect(error).toBeNull()
  return data ?? []
}

describeDb('el recordatorio de una camada', () => {
  // Covers: US3-AS3, FR-011, SC-001
  it('sale una sola vez por camada, con su nombre y su vencimiento', async () => {
    const { publisher, litter } = await scene()
    const expiresAt = inDays(6.9)
    await setLitterExpiry(litter.litterId, expiresAt)

    const { data } = await db().rpc('claim_litter_reminders', { p_limit: ALL })
    const mine = (data ?? []).filter((row) => row.litter_id === litter.litterId)
    expect(mine).toHaveLength(1)
    expect(mine[0]).toMatchObject({ owner_id: publisher.id, name: 'La camada de Luna' })
    expect(msFrom(mine[0]?.expires_at, Date.parse(expiresAt))).toBe(0)
    expect(msFrom((await litterRow(litter.litterId))?.reminder_sent_at, Date.now())).toBeLessThan(
      60_000,
    )
    expect(await claimedLitters()).not.toContain(litter.litterId)

    // Renovar abre un vencimiento nuevo, con su propio recordatorio.
    await changeLitter(publisher.id, litter.litterId, 'renew')
    await setLitterExpiry(litter.litterId, inDays(5))
    expect(await claimedLitters()).toContain(litter.litterId)
  })

  // Covers: FR-011, Edge Cases (el correo no sale si la camada queda pausada, adoptada o dada de baja)
  it('ni antes de los 7 días, ni pausada, adoptada, dada de baja o de una cuenta suspendida', async () => {
    const owner = await person(1, 'Quien publica')
    const scenes = await Promise.all(Array.from({ length: 4 }, () => litterWithYoung(owner.id, 2)))
    const [early, paused, adopted, takenDown] = scenes
    await setLitterExpiry(early.litterId, inDays(7.1))
    for (const one of [paused, adopted, takenDown]) {
      // oxlint-disable-next-line no-await-in-loop -- tres camadas, una detrás de la otra
      await setLitterExpiry(one.litterId, inDays(3))
    }
    await pauseLitter(paused.litterId)
    for (const young of adopted.young) {
      // oxlint-disable-next-line no-await-in-loop -- dos crías, una detrás de la otra
      expect((await markAdopted(owner, young.id, null)).outcome).toBe('done')
    }
    await db()
      .from('litters')
      .update({ taken_down_at: new Date().toISOString(), takedown_reason: 'sale_or_money' })
      .eq('id', takenDown.litterId)

    const other = await person(1, 'Suspendida')
    const theirs = await litterWithYoung(other.id, 2)
    await setLitterExpiry(theirs.litterId, inDays(3))
    await suspend(other.id)

    const claimed = await claimedLitters()
    for (const { litterId } of [...scenes, theirs]) expect(claimed).not.toContain(litterId)
  })

  // Covers: FR-010, FR-042 (cada vencimiento se mide una vez)
  it('cada camada vencida se cuenta una sola vez, y no una pausada', async () => {
    const owner = await person(1, 'Quien publica')
    const [expired, paused] = await Promise.all([
      litterWithYoung(owner.id, 2),
      litterWithYoung(owner.id, 2),
    ])
    const publishedAt = inDays(-31)
    await db().from('litters').update({ published_at: publishedAt }).eq('id', expired.litterId)
    await expireLitter(expired.litterId)
    await pauseLitter(paused.litterId)
    await setLitterExpiry(paused.litterId, inDays(-1))

    const first = await db().rpc('claim_litter_expiries', { p_limit: ALL })
    expect(first.error).toBeNull()
    const mine = (first.data ?? []).filter(
      (row) => msFrom(row.published_at, Date.parse(publishedAt)) === 0,
    )
    expect(mine).toHaveLength(1)
    expect((await litterRow(expired.litterId))?.expiry_counted_at).not.toBeNull()
    expect((await litterRow(paused.litterId))?.expiry_counted_at).toBeNull()

    const second = await db().rpc('claim_litter_expiries', { p_limit: ALL })
    expect(
      (second.data ?? []).filter((row) => msFrom(row.published_at, Date.parse(publishedAt)) === 0),
    ).toEqual([])
  })
})

describeDb('«Sigue disponible» de una camada', () => {
  // Covers: US3-AS3, FR-012
  it('una disponible se renueva entera por 30 días, sin cambiar ninguna cría', async () => {
    const { publisher, litter } = await scene(3)
    await db().from('pets').update({ status: 'in_process' }).eq('id', litter.young[1].id)
    await setLitterExpiry(litter.litterId, inDays(3))
    const tokenHash = await linkFor(litter.litterId)

    const row = await renew(tokenHash)
    expect(row).toMatchObject({
      outcome: 'renewed',
      pet_name: 'La camada de Luna',
      sex: null,
      is_litter: true,
    })
    expect(msFrom(row.expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(60_000)
    const young = await youngOf(litter.litterId)
    expect(young.map((one) => one.status)).toEqual(['available', 'in_process', 'available'])
    for (const one of young) expect(one.expires_at).toBe(row.expires_at)

    // Otra vez el mismo enlace: renueva de nuevo, sin sumar.
    expect(msFrom((await renew(tokenHash)).expires_at, Date.now() + LIFETIME_MS)).toBeLessThan(
      60_000,
    )
    expect(await viewOf(tokenHash)).toEqual([
      expect.objectContaining({
        name: 'La camada de Luna',
        sex: null,
        state: 'available',
        is_litter: true,
        cover_owner: publisher.id,
      }),
    ])
  })

  // Covers: US3-AS4, FR-012, Edge Cases («Sigue disponible» sobre cada estado)
  it('una vencida vuelve a publicarse; pausada, adoptada o dada de baja no cambia', async () => {
    const owner = await person(1, 'Quien publica')
    const [expired, paused, adopted, takenDown] = await Promise.all(
      Array.from({ length: 4 }, () => litterWithYoung(owner.id, 2)),
    )
    await expireLitter(expired.litterId)
    await pauseLitter(paused.litterId)
    for (const young of adopted.young) {
      // oxlint-disable-next-line no-await-in-loop -- dos crías, una detrás de la otra
      await markAdopted(owner, young.id, null)
    }
    await db()
      .from('litters')
      .update({ taken_down_at: new Date().toISOString(), takedown_reason: 'sale_or_money' })
      .eq('id', takenDown.litterId)

    expect(await renew(await linkFor(expired.litterId))).toMatchObject({
      outcome: 'republished',
      is_litter: true,
    })
    expect((await litterRow(expired.litterId))?.expiry_counted_at).toBeNull()

    for (const [one, state] of [
      [paused, 'paused'],
      [adopted, 'adopted'],
      [takenDown, 'taken_down'],
    ] as const) {
      // oxlint-disable-next-line no-await-in-loop -- tres camadas, una detrás de la otra
      const before = await litterRow(one.litterId)
      // oxlint-disable-next-line no-await-in-loop
      expect(await renew(await linkFor(one.litterId))).toMatchObject({
        outcome: state,
        pet_name: 'La camada de Luna',
        is_litter: true,
      })
      // oxlint-disable-next-line no-await-in-loop
      expect(await litterRow(one.litterId)).toEqual(before)
    }
  })

  // Covers: US3-AS7, FR-004, FR-012
  it('sin nivel 1 de quien publicó no cambia nada', async () => {
    const { publisher, litter } = await scene()
    await setLitterExpiry(litter.litterId, inDays(3))
    await setPhone(publisher.id, 'none')
    const before = await litterRow(litter.litterId)

    expect(await renew(await linkFor(litter.litterId))).toMatchObject({
      outcome: 'needs_verification',
      is_litter: true,
    })
    expect((await litterRow(litter.litterId))?.expires_at).toBe(before?.expires_at)
  })

  // Covers: US3-AS8, FR-012
  it('un enlace vencido, alterado o de una camada borrada no sirve y nada cambia', async () => {
    const { publisher, litter } = await scene()
    await setLitterExpiry(litter.litterId, inDays(3))
    const before = await litterRow(litter.litterId)
    const old = await linkFor(litter.litterId)
    await sql(
      `update public.pet_renewal_links set expires_at = now() - interval '1 minute' where token_hash = '${old}'`,
    )
    const altered = hashRenewalToken(newRenewalToken())

    for (const tokenHash of [old, altered]) {
      // oxlint-disable-next-line no-await-in-loop -- dos enlaces, uno detrás del otro
      expect(await renew(tokenHash)).toEqual({
        outcome: 'invalid',
        pet_name: null,
        sex: null,
        expires_at: null,
        is_litter: false,
      })
      // oxlint-disable-next-line no-await-in-loop
      expect(await viewOf(tokenHash)).toEqual([])
    }
    expect((await litterRow(litter.litterId))?.expires_at).toBe(before?.expires_at)

    const gone = await linkFor(litter.litterId)
    const { error } = await db().rpc('delete_litter', {
      p_owner: publisher.id,
      p_litter: litter.litterId,
    })
    expect(error).toBeNull()
    expect((await renew(gone)).outcome).toBe('invalid')
    expect(await viewOf(gone)).toEqual([])
  })

  // Covers: research R5 (un solo sujeto por enlace)
  it('un enlace no puede ser de un animal y de una camada a la vez', async () => {
    const { litter } = await scene()
    const { error } = await db()
      .from('pet_renewal_links')
      .insert({
        token_hash: hashRenewalToken(newRenewalToken()),
        pet_id: litter.young[0].id,
        litter_id: litter.litterId,
        expires_at: inDays(30),
      })
    expect(error?.message).toContain('pet_renewal_links_one_subject')
  })
})

describeDb('la reactivación de una cuenta', () => {
  // Covers: research R5 (decisión 2026-10-05: el vencimiento se corre lo que duró la suspensión)
  it('corre el vencimiento de la camada y de sus crías lo que duró la suspensión', async () => {
    const [lucia, { publisher, litter }] = [await admin(), await scene()]
    await setLitterExpiry(litter.litterId, inDays(10))
    const before = await litterRow(litter.litterId)
    const suspensionId = await suspend(publisher.id, lucia.id)
    await sql(
      `update public.account_suspensions set suspended_at = suspended_at - interval '5 days' where id = '${suspensionId}'`,
    )
    expect((await reactivateAs(lucia.client, suspensionId)).outcome).toBe('done')

    const lifted = await db()
      .from('account_suspensions')
      .select('suspended_at, lifted_at')
      .eq('id', suspensionId)
      .single()
    const lasted =
      Date.parse(String(lifted.data?.lifted_at)) - Date.parse(String(lifted.data?.suspended_at))
    const after = await litterRow(litter.litterId)
    expect(msFrom(after?.expires_at, Date.parse(String(before?.expires_at)) + lasted)).toBeLessThan(
      2,
    )
    for (const young of await youngOf(litter.litterId)) {
      expect(young.expires_at).toBe(after?.expires_at)
    }
  })
})
