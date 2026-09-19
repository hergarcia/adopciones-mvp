'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL } from '@/lib/config'
import { emailSchema } from '@/lib/schemas/auth'
import {
  countRecentLinks,
  deleteLinksFor,
  getLoginLink,
  purgeExpired,
  recordLoginLink,
  supersedeLinks,
} from '@/lib/supabase/queries/login-links'
import { endSession } from '@/lib/supabase/queries/session'
import { generateLoginToken } from '@/lib/supabase/queries/login-tokens'
import { purgeUnconfirmedAccounts } from '@/lib/auth/accounts'
import { planLinkRequest, visibleResult } from '@/lib/auth/link-request-policy'
import { checkWindow, recordRequest } from '@/lib/auth/request-window'
import { sendLoginLink } from '@/lib/email/send-login-link'
import { track } from '@/lib/analytics/track'
import type { ActionResult } from './result'
import { EMAIL_COOKIE, readRequestHistory, writeRequestHistory } from '@/lib/auth/request-cookies'

const LINK_TTL_MINUTES = 60

export async function requestLoginLink(
  email: string,
  next?: string,
): Promise<ActionResult<{ waitSeconds: number }>> {
  const parsed = emailSchema.safeParse({ email })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'auth.errors.email_format' }
  }

  const address = parsed.data.email
  const now = new Date()
  const plan = planLinkRequest({
    window: checkWindow(await readRequestHistory(), now),
    emailsToAddressInLastHour: await countRecentLinks(address, now),
  })

  if (plan.outcome === 'accepted') {
    const outcome = await issueLink(address, next, now, plan.send)
    if (!outcome.ok) return { ok: false, error: 'auth.errors.send_failed' }

    // Solo un pedido que llegó a destino gasta ventana: un envío que falló no es culpa de la
    // persona y no puede dejarla esperando un minuto por nada (FR-003a).
    await writeRequestHistory(recordRequest(await readRequestHistory(), now))
  }

  await rememberAddress(address)
  return { ok: true, data: visibleResult(plan) }
}

// La acción de «El enlace no sirve»: toma el id del enlace y resuelve la dirección del lado del
// servidor, así el cliente nunca conoce el correo y la pantalla no lo puede revelar (FR-005b).
export async function resendLinkFor(
  linkId: string,
  next?: string,
): Promise<ActionResult<{ waitSeconds: number }>> {
  const stored = await getLoginLink(linkId)
  if (stored === null) return { ok: false, error: 'auth.errors.link_unknown' }
  return requestLoginLink(stored.email, next)
}

export async function signOut(): Promise<never> {
  await endSession()
  await track('signed_out')
  redirect('/')
}

async function issueLink(address: string, next: string | undefined, now: Date, send: boolean) {
  await supersedeLinks(address, now)

  const expiresAt = new Date(now.getTime() + LINK_TTL_MINUTES * 60 * 1000)
  const id = await recordLoginLink({
    email: address,
    expiresAt,
    delivery: send ? 'sent' : 'skipped_rate_limit',
  })

  // La limpieza va acá porque pedir un enlace es lo único que hace crecer la tabla, y de paso
  // borra las personas que nunca abrieron el suyo (FR-030a).
  await purgeExpired(now)
  await purgeUnconfirmedAccounts(now)

  if (!send) return { ok: true as const }

  const token = await generateLoginToken(address)
  if (token === null) return { ok: false as const }

  const t = await getTranslations('emails.login_link')
  const url = new URL('/auth/confirm', APP_URL)
  url.searchParams.set('link', id)
  url.searchParams.set('token_hash', token)
  if (next) url.searchParams.set('next', next)

  return sendLoginLink({
    to: address,
    subject: t('subject'),
    url: url.toString(),
    texts: {
      heading: t('heading', { app: APP_NAME }),
      body: t('body'),
      button: t('button'),
      fallback: t('fallback'),
      notYou: t('not_you'),
    },
  })
}

// La dirección viaja en una cookie httpOnly de vida corta y no en la URL: en la URL quedaría en
// el historial, en los registros del servidor y en el `Referer` de cualquier cosa que la pantalla
// cargue (constitución §V).
async function rememberAddress(address: string) {
  ;(await cookies()).set(EMAIL_COOKIE, address, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 30,
  })
}

export async function forgetLinksFor(email: string): Promise<void> {
  await deleteLinksFor(email)
}
