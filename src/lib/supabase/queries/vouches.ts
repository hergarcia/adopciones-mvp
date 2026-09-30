import { cache } from 'react'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import type {
  GiveOutcome,
  MyVouch,
  PublicProfile,
  RemoveOutcome,
  Voucher,
  VouchStanding,
  WithdrawOutcome,
} from '@/lib/vouches/types'
import { isDepartmentCode } from '@/lib/zones/departments'

// El perfil público y los avales (historia #12). Todo con permisos de servicio y **solo** a las
// funciones de la base, que recortan lo ajeno: nadie lee las tablas desde acá (research R2). Si la
// base no responde, las lecturas lanzan y la falla se ve en el `error.tsx` de la ruta, sin
// confundirse con un perfil que no existe.

const TTL = DB_RULES.p_pending_ttl

function toVouchers(value: unknown): Voucher[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return []
    const publicId: unknown = Reflect.get(item, 'public_id')
    const displayName: unknown = Reflect.get(item, 'display_name')
    const department: unknown = Reflect.get(item, 'department')
    const locality: unknown = Reflect.get(item, 'locality')
    const hasPhoto: unknown = Reflect.get(item, 'has_photo')
    return typeof publicId === 'string' &&
      typeof displayName === 'string' &&
      typeof department === 'string' &&
      isDepartmentCode(department) &&
      typeof locality === 'string' &&
      typeof hasPhoto === 'boolean'
      ? [{ publicId, displayName, department, locality, hasPhoto }]
      : []
  })
}

// En caché por pedido: la piden `generateMetadata` y la página.
export const getPublicProfile = cache(async (publicId: string): Promise<PublicProfile | null> => {
  const { data, error } = await createServiceSupabase().rpc('public_profile', {
    p_public_id: publicId,
    p_pending_ttl: TTL,
  })
  if (error) throw new Error('No se pudo leer el perfil público', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  // El `check` de la base ya lo garantiza; la guarda se lo muestra al compilador.
  if (!isDepartmentCode(row.department)) {
    throw new Error(`departamento fuera de la lista en el perfil ${row.public_id}`)
  }
  return {
    publicId: row.public_id,
    displayName: row.display_name,
    department: row.department,
    locality: row.locality,
    isRescuer: row.is_rescuer,
    hasPhoto: row.has_photo,
    memberSince: row.member_since,
    levelOne: row.level_one,
    // Los tipos generados no saben que una columna de una función puede ser nula.
    identitySince: row.identity_since ?? null,
    vouchers: toVouchers(row.vouchers),
  }
})

export async function getVouchStanding(
  viewerId: string,
  publicId: string,
): Promise<VouchStanding | null> {
  const { data, error } = await createServiceSupabase().rpc('vouch_standing', {
    p_viewer: viewerId,
    p_target_public_id: publicId,
  })
  if (error) throw new Error('No se pudo leer la relación entre las dos personas', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  return {
    viewerVouches: row.viewer_vouches,
    targetVouchesViewer: row.target_vouches_viewer,
    blockedByTarget: row.blocked_by_target,
  }
}

export async function listMyVouches(userId: string): Promise<MyVouch[]> {
  const { data, error } = await createServiceSupabase().rpc('my_vouches', {
    p_user: userId,
    p_pending_ttl: TTL,
  })
  if (error) throw new Error('No se pudieron leer los avales', { cause: error })
  return data.map((row) => ({
    direction: row.direction === 'given' ? 'given' : 'received',
    otherPublicId: row.other_public_id,
    otherDisplayName: row.other_display_name,
    otherHasPhoto: row.other_has_photo,
    givenOn: row.given_on,
    mineLacksLevelTwo: row.mine_lacks_level_two,
    otherLacksLevelTwo: row.other_lacks_level_two,
  }))
}

const GIVE_OUTCOMES: readonly GiveOutcome[] = [
  'given',
  'not_found',
  'self',
  'reciprocal',
  'blocked',
  'vouchee_level',
  'voucher_level',
]

export type GiveResult = { outcome: GiveOutcome; created: boolean; reachedLevelThree: boolean }

// Nulo si la base no respondió: la cadena termina en una acción, que no lanza.
export async function giveVouchAs(voucherId: string, publicId: string): Promise<GiveResult | null> {
  const { data, error } = await createServiceSupabase().rpc('give_vouch', {
    p_voucher: voucherId,
    p_vouchee_public_id: publicId,
    p_pending_ttl: TTL,
  })
  const row = error ? undefined : data[0]
  const outcome = GIVE_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  return { outcome, created: row.created, reachedLevelThree: row.reached_level_three }
}

export async function withdrawVouchAs(
  voucherId: string,
  publicId: string,
): Promise<WithdrawOutcome | null> {
  const { data, error } = await createServiceSupabase().rpc('withdraw_vouch', {
    p_voucher: voucherId,
    p_vouchee_public_id: publicId,
  })
  if (error) return null
  return data === 'withdrawn' || data === 'absent' ? data : null
}

export async function removeVouchAs(
  voucheeId: string,
  publicId: string,
): Promise<RemoveOutcome | null> {
  const { data, error } = await createServiceSupabase().rpc('remove_vouch', {
    p_vouchee: voucheeId,
    p_voucher_public_id: publicId,
  })
  if (error) return null
  return data === 'removed' || data === 'absent' ? data : null
}
