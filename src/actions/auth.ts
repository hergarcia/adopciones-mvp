'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL } from '@/lib/config'
import { emailSchema } from '@/lib/schemas/auth'
import {
  countRecentLinks,
  getLoginLink,
  markLinkFailed,
  purgeExpired,
  recordLoginLink,
  supersedeLink,
  supersedeLinks,
} from '@/lib/supabase/queries/login-links'
import { endSession, startGoogleSignIn as beginGoogleSignIn } from '@/lib/supabase/queries/session'
import { generateLoginToken } from '@/lib/supabase/queries/login-tokens'
import { purgeUnconfirmedAccounts } from '@/lib/auth/accounts'
import { planLinkRequest, visibleResult } from '@/lib/auth/link-request-policy'
import { safeDestination, signInRetryPath } from '@/lib/auth/next-destination'
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
  return issueFor(email, next, { remember: true })
}

// `remember` decide si la dirección queda en la cookie que después pinta «Te mandamos un enlace a
// …». Va en false cuando el pedido salió de un enlace y no de alguien escribiendo su correo: ese
// enlace pudo abrirlo cualquiera —un reenvío, un buzón compartido— y mostrarle la dirección sería
// revelarla justo por el camino que FR-005b cierra.
async function issueFor(
  email: string,
  next: string | undefined,
  options: { remember: boolean },
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

  // El tope de este navegador sí se le cuenta, con los segundos que faltan: es información sobre
  // sus propios pedidos, no sobre la dirección (FR-006a, US1-AS7, US1-AS8). El tope mudo por
  // dirección, en cambio, sigue por el camino de siempre y no se distingue desde afuera.
  if (plan.outcome === 'wait') {
    if (options.remember) await rememberAddress(address)
    return { ok: false, error: 'auth.errors.rate_limited', seconds: plan.waitSeconds }
  }

  const outcome = await issueLink(address, next, now, plan.send)
  if (!outcome.ok) return { ok: false, error: 'auth.errors.send_failed' }

  // Solo un pedido que llegó a destino gasta ventana: un envío que falló no es culpa de la
  // persona y no puede dejarla esperando un minuto por nada (FR-003a).
  await writeRequestHistory(recordRequest(await readRequestHistory(), now))

  if (options.remember) await rememberAddress(address)
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
  return issueFor(stored.email, next, { remember: false })
}

export async function startGoogleSignIn(formData: FormData): Promise<never> {
  const field = formData.get('next')
  const next = typeof field === 'string' && field !== '' ? field : null

  const callback = new URL('/auth/callback', APP_URL)
  if (next) callback.searchParams.set('next', safeDestination(next))

  const url = await beginGoogleSignIn(callback.toString())
  redirect(url ?? signInRetryPath('google-cancelado', next))
}

export async function signOut(): Promise<never> {
  await endSession()
  await track('signed_out')
  redirect('/')
}

async function issueLink(address: string, next: string | undefined, now: Date, send: boolean) {
  // La limpieza va acá porque pedir un enlace es lo único que hace crecer la tabla, y de paso
  // borra las personas que nunca abrieron el suyo (FR-030a).
  await purgeExpired(now)
  await purgeUnconfirmedAccounts(now)

  const expiresAt = new Date(now.getTime() + LINK_TTL_MINUTES * 60 * 1000)

  // Pasado el tope mudo por dirección se anota el pedido y **no se toca el enlace que la persona
  // ya tiene en el buzón**. Matarlo sin mandarle otro sería dejarla afuera con un mensaje que le
  // dice que busque un correo que nunca salió, y es exactamente el bloqueo que FR-006c prohíbe:
  // el tope frena correos nuevos, no invalida lo ya emitido.
  if (!send) {
    await recordLoginLink({ email: address, expiresAt, delivery: 'skipped_rate_limit' })
    return { ok: true as const }
  }

  const link = await generateLoginToken(address)
  if (link === null) return { ok: false as const }

  const id = await recordLoginLink({
    email: address,
    expiresAt,
    delivery: 'sent',
    firstSignIn: link.firstSignIn,
  })
  if (id === null) return { ok: false as const }

  const t = await getTranslations('emails.login_link')
  const url = new URL('/auth/confirm', APP_URL)
  url.searchParams.set('link', id)
  url.searchParams.set('token_hash', link.token)
  if (next) url.searchParams.set('next', next)

  const sent = await sendLoginLink({
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

  if (!sent.ok) {
    // El que no salió es el que muere, y además deja de contar para el cupo de la dirección: si
    // contara, diez fallas seguidas del servicio de correo dejarían esa dirección una hora sin
    // poder recibir nada, en silencio (FR-003a).
    await supersedeLink(id, now)
    await markLinkFailed(id)
    return { ok: false as const }
  }

  // Y recién ahora muere el anterior, cuando ya hay uno nuevo en camino (FR-004).
  await supersedeLinks(address, now, id)
  return { ok: true as const }
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
