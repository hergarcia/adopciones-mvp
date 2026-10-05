// Lo que comparten las pruebas de los animales a la vista (historia #57): publicadores en cada
// estado del teléfono, animales publicados con sus fotos, y una ventana de fechas propia de cada
// prueba. El listado real mezcla animales de otras pruebas; los de acá se publican en el año 2999
// más un desplazamiento al azar, así quedan primeros y se leen con un cursor que empieza justo
// después de su ventana (research R14).
import { expect } from 'vitest'
import { requireEnv } from '../../src/lib/env'
import { db, randomNumber } from './phone-support'
import { FIELDS, webp } from './pet-support'
import { asNewUser, serviceClient, type SyntheticUser } from './roles'

export type PhoneState =
  'level_one' | 'none' | 'pending_only' | 'change_pending' | 'change_expired' | 'lost'

export type Publisher = SyntheticUser & {
  phone: string | null
  profileLocality: string
}

type PublisherOptions = {
  phone?: PhoneState
  identity?: boolean
  rescuer?: boolean
  avatar?: boolean
}

const DAY_MS = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString()

// Cada estado es la fila que dejaría el flujo de la #10 o la #25, escrita directo.
export async function setPhone(userId: string, state: PhoneState): Promise<string | null> {
  await db().from('phones').delete().eq('user_id', userId)
  if (state === 'none') return null
  const verified = randomNumber()
  const pending = randomNumber()
  const rows: Record<Exclude<PhoneState, 'none'>, Record<string, string | null>> = {
    level_one: { verified_number: verified, verified_at: ago(1) },
    pending_only: { pending_number: pending, pending_since: ago(0) },
    change_pending: {
      verified_number: verified,
      verified_at: ago(30),
      pending_number: pending,
      pending_since: ago(1),
    },
    // Más viejo que el TTL de 7 días: cuenta como nivel 1, igual que `phoneStatus`.
    change_expired: {
      verified_number: verified,
      verified_at: ago(30),
      pending_number: pending,
      pending_since: ago(8),
    },
    lost: { number_lost_on: ago(1).slice(0, 10) },
  }
  const { error } = await db()
    .from('phones')
    .insert({ user_id: userId, ...rows[state] })
  expect(error).toBeNull()
  return state === 'pending_only' ? pending : state === 'lost' ? null : verified
}

export function publishers(cleanups: SyntheticUser['cleanup'][]) {
  return async function publisher(options: PublisherOptions = {}): Promise<Publisher> {
    const user = await asNewUser()
    cleanups.push(user.cleanup)
    // Otra zona que la de sus animales, para ver que la del perfil no sale nunca (SC-003).
    const profileLocality = `Perfil ${crypto.randomUUID().slice(0, 8)}`
    const avatarPath = options.avatar ? `${user.id}/avatar.webp` : null
    const { error } = await db()
      .from('profiles')
      .insert({
        id: user.id,
        display_name: 'Ana Rodríguez',
        department: 'UY-SA',
        locality: profileLocality,
        is_rescuer: options.rescuer ?? false,
        avatar_path: avatarPath,
      })
    expect(error).toBeNull()
    if (avatarPath !== null) {
      const uploaded = await serviceClient()
        .storage.from('avatars')
        .upload(avatarPath, webp(), { contentType: 'image/webp', upsert: true })
      expect(uploaded.error).toBeNull()
    }
    if (options.identity) {
      const identity = await db()
        .from('identity_verifications')
        .insert({ user_id: user.id, verified_on: ago(2).slice(0, 10) })
      expect(identity.error).toBeNull()
    }
    const phone = await setPhone(user.id, options.phone ?? 'level_one')
    return { ...user, phone, profileLocality }
  }
}

/** Una ventana de fechas propia, en el año 2999: `at(n)` es el animal n, del más viejo al más nuevo. */
export type Window = { start: Date; end: Date; at: (minute: number) => string }

// Dos horas al azar en cinco años: que la ventana de una prueba se cruce con la de otra, o con lo que
// dejó una corrida que se cortó, es casi imposible.
export function futureWindow(): Window {
  const offsetMinutes = Math.floor(Math.random() * 5 * 365 * 24 * 60)
  const start = new Date(Date.UTC(2999, 0, 1) + offsetMinutes * 60_000)
  const end = new Date(start.getTime() + 2 * 3_600_000)
  return { start, end, at: (minute) => new Date(start.getTime() + minute * 60_000).toISOString() }
}

export type ListedPet = { petId: string; code: string; photoIds: string[] }

type PetOptions = {
  fields?: Partial<typeof FIELDS>
  photos?: number
  publishedAt?: string
  /** Sube los objetos de las fotos, para las pruebas de firmar. */
  upload?: boolean
}

// Directo con permisos de servicio y no por `publish_pet`: así se publica con la fecha de la
// ventana y a nombre de alguien que después pierde el nivel 1. El código lo pone el trigger.
export async function listPet(ownerId: string, options: PetOptions = {}): Promise<ListedPet> {
  const { data, error } = await db()
    .from('pets')
    .insert({
      owner_id: ownerId,
      attempt_id: crypto.randomUUID(),
      // Lo exige el tipo; el trigger lo reemplaza siempre por uno nuevo.
      code: '0000000000',
      ...FIELDS,
      ...options.fields,
      published_at: options.publishedAt ?? new Date().toISOString(),
    })
    .select('id, code')
    .single()
  expect(error).toBeNull()
  if (data === null) throw new Error('no se pudo publicar el animal de prueba')

  const photoIds = Array.from({ length: options.photos ?? 1 }, () => crypto.randomUUID())
  const photos = await db()
    .from('pet_photos')
    .insert(
      photoIds.map((id, position) => ({
        id,
        owner_id: ownerId,
        pet_id: data.id,
        position,
        width: 1280,
        height: 1600,
        thumbhash: 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw',
      })),
    )
  expect(photos.error).toBeNull()

  if (options.upload) {
    const bucket = serviceClient().storage.from('pet-photos')
    await Promise.all(
      photoIds.map(async (photoId) => {
        const uploaded = await bucket.upload(`${ownerId}/${photoId}/card.webp`, webp(), {
          contentType: 'image/webp',
          upsert: true,
        })
        expect(uploaded.error).toBeNull()
      }),
    )
  }
  return { petId: data.id, code: data.code, photoIds }
}

// SQL crudo por pg-meta, con permisos de dueño: para las funciones de `private`, que la API no
// publica, y para reemplazar una función dentro de una transacción que se deshace al final.
export async function sql<T>(query: string): Promise<T[]> {
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const response = await fetch(`${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/pg/query`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const rows: T[] = await response.json()
  if (!response.ok) throw new Error(`sql falló: ${JSON.stringify(rows)}`)
  return rows
}

/** Lo que devuelve el listado desde justo después de la ventana, con el cursor. */
type ListedRow = { code: string; total: number; status: string; published_at: string }

// Todo lo publicado antes del final de la ventana: el cursor solo pone el techo.
async function listedBefore(
  client: SyntheticUser['client'],
  window: Window,
  filters: Record<string, unknown> = {},
): Promise<ListedRow[]> {
  const { data, error } = await client.rpc('listed_pets', {
    p_after_published: window.end.toISOString(),
    p_after_code: 'zzzzzzzzzz',
    p_limit: 241,
    ...filters,
  })
  expect(error).toBeNull()
  return data ?? []
}

// Sin el piso entrarían los animales de la ventana de otra prueba que corre a la vez y quedó más
// vieja.
export async function listedAfter(
  client: SyntheticUser['client'],
  window: Window,
  filters: Record<string, unknown> = {},
) {
  const rows = await listedBefore(client, window, filters)
  return rows.filter((row) => new Date(row.published_at) >= window.start)
}

export async function countedInWindow(client: SyntheticUser['client'], window: Window) {
  const after = await listedBefore(client, window)
  const { data } = await client.rpc('listed_pets', {
    p_after_published: window.start.toISOString(),
    p_after_code: '0000000000',
    p_limit: 1,
  })
  const older: { total: number }[] = data ?? []
  return (after[0]?.total ?? 0) - (older[0]?.total ?? 0)
}
