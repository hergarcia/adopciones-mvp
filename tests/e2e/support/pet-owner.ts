import { expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '../../../src/lib/env'
import { loadEnvLocal } from '../../setup/database'
import { hasMail, linkFor } from './mailbox'
import { openEmailSignIn, uniqueEmail } from './sign-in'

loadEnvLocal()

const LOGIN_SUBJECT = 'Tu enlace para entrar'

export function service() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

function uniqueNumber(): string {
  const rest = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return `+5989${1 + Math.floor(Math.random() * 9)}${rest}`
}

// Una rescatista con nivel 1, propia de esta corrida: las pruebas comparten la base, y los animales
// de otra corrida dispararían el aviso de nombre repetido.
export async function levelOneOwner(): Promise<{ id: string; email: string }> {
  const email = uniqueEmail()
  const db = service()
  const created = await db.auth.admin.createUser({ email, email_confirm: true })
  const id = created.data.user?.id ?? ''
  expect(created.error).toBeNull()
  const profile = await db
    .from('profiles')
    .insert({ id, display_name: 'Ana Prueba', department: 'UY-MO', locality: 'Pocitos' })
  expect(profile.error).toBeNull()
  const phone = await db
    .from('phones')
    .insert({ user_id: id, verified_number: uniqueNumber(), verified_at: new Date().toISOString() })
  expect(phone.error).toBeNull()
  return { id, email }
}

export async function signIn(page: Page, email: string, next: string) {
  await page.goto(`/entrar?next=${encodeURIComponent(next)}`)
  await openEmailSignIn(page)
  await expect(page.getByRole('button', { name: /enlace/i })).toBeEnabled()
  await page.getByRole('textbox').fill(email)
  await page.getByRole('button', { name: /enlace/i }).click()
  await expect(page).toHaveURL(/revisa-tu-correo/)
  // El correo se escribe después de responder: con varias pruebas en paralelo puede tardar.
  await expect.poll(() => hasMail(email, LOGIN_SUBJECT)).toBe(true)
  await page.goto(linkFor(email))
}
