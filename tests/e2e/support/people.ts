import { expect } from '@playwright/test'
import { service } from './pet-owner'
import { uniqueEmail } from './sign-in'

export type Person = { id: string; email: string; publicId: string; name: string }

function uniqueNumber(): string {
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return `+5989${1 + Math.floor(Math.random() * 9)}${rest}`
}

// Una persona propia de la corrida, con el perfil completo y el nivel pedido: las pruebas comparten
// la base, y tocar a las personas sembradas cambiaría las capturas y las otras pruebas.
export async function newPerson(
  name: string,
  options: { level?: 0 | 1 | 2; avatarPath?: (id: string) => string } = {},
): Promise<Person> {
  const db = service()
  const email = uniqueEmail()
  const created = await db.auth.admin.createUser({ email, email_confirm: true })
  expect(created.error).toBeNull()
  const id = created.data.user?.id ?? ''
  const profile = await db
    .from('profiles')
    .insert({
      id,
      display_name: name,
      department: 'UY-RO',
      locality: 'La Paloma',
      avatar_path: options.avatarPath?.(id) ?? null,
    })
    .select('public_id')
    .single()
  expect(profile.error).toBeNull()
  const level = options.level ?? 2
  if (level >= 1) {
    const phone = await db.from('phones').insert({
      user_id: id,
      verified_number: uniqueNumber(),
      verified_at: new Date().toISOString(),
    })
    expect(phone.error).toBeNull()
  }
  if (level >= 2) {
    const identity = await db
      .from('identity_verifications')
      .insert({ user_id: id, verified_on: '2026-08-14' })
    expect(identity.error).toBeNull()
  }
  return { id, email, publicId: String(profile.data?.public_id ?? ''), name }
}

export async function removePerson(person: Person): Promise<void> {
  await service().auth.admin.deleteUser(person.id)
}
