import { getTranslations } from 'next-intl/server'
import { alertName } from '@/lib/alerts/alert-name'
import { alertNameWords } from '@/lib/alerts/alert-name-texts'
import { alertMailParts, mailItemCount } from '@/lib/alerts/mail-parts'
import { unsubscribePath } from '@/lib/alerts/paths'
import type { AlertMailClaim, AlertMailPart, AlertMatch } from '@/lib/alerts/types'
import { alertMailSentEvent } from '@/lib/analytics/alert-events'
import { trackAll } from '@/lib/analytics/track'
import { APP_NAME, APP_URL } from '@/lib/config'
import { ROUTE_TASKS } from '@/lib/cron/route-tasks'
import { taskFailed } from '@/lib/errors/report'
import { litterPath, litterShareImagePath } from '@/lib/litters/paths'
import { hashLinkToken, newLinkToken } from '@/lib/links/link-token'
import { listingHref } from '@/lib/pets/listing-query'
import { LISTING_PATH, petPath, petShareImagePath } from '@/lib/pets/paths'
import { shareUrl } from '@/lib/pets/share-url'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import {
  claimPetAlertMail,
  createUnsubscribeLink,
  markPetAlertsMailed,
} from '@/lib/supabase/queries/pet-alerts'
import { zoneName } from '@/lib/zones/zone-name'
import { deliverNotice } from './deliver-notice'
import type { NoticeEmailGroup } from './notice-email-template'
import { reportEmailFailure } from './report-email-failure'
import { sendEmail } from './send-email'

// De a uno y espaciados, como los resúmenes que salen justo antes: Resend acepta unos pocos pedidos
// por segundo, y el día de cada persona ya quedó reclamado.
const MAIL_SPACING_MS = 600

// Corren en la ruta del resumen: una falla se avisa con el nombre de esa tarea.
const TASK = ROUTE_TASKS.resumen

type ItemTexts = {
  petDetail: (pet: Extract<AlertMatch, { kind: 'pet' }>) => string
  litterDetail: (litter: Extract<AlertMatch, { kind: 'litter' }>) => string
  petAlt: (pet: Extract<AlertMatch, { kind: 'pet' }>) => string
  litterAlt: (litter: Extract<AlertMatch, { kind: 'litter' }>) => string
}

async function itemTexts(locale: string): Promise<ItemTexts> {
  const [pets, myPets, litters, mail] = await Promise.all([
    getTranslations({ locale, namespace: 'pets' }),
    getTranslations({ locale, namespace: 'pets.my_pets' }),
    getTranslations({ locale, namespace: 'litters.card' }),
    getTranslations({ locale, namespace: 'emails.pet_alerts' }),
  ])
  return {
    petDetail: (pet) =>
      pets('page.summary', {
        species: pet.species,
        sex: pet.sex,
        age: pets('age', { unit: pet.age.unit, value: pet.age.value }),
      }),
    litterDetail: (litter) => mail('litter', { species: litter.species, count: litter.youngCount }),
    petAlt: (pet) =>
      myPets('photo_alt', {
        name: pet.name,
        species: pet.species,
        sex: pet.sex,
        zone: zoneName(pet.zone),
      }),
    litterAlt: (litter) =>
      litters('photo_alt', {
        name: litter.name,
        species: litter.species,
        zone: zoneName(litter.zone),
      }),
  }
}

// Cada renglón abre la ficha con la marca del correo (research R11, R12) y lleva la imagen de
// compartir, que es pública mientras se ve en el listado. Nada de quien publicó (FR-023).
function itemOf(item: AlertMatch, texts: ItemTexts): NoticeEmailGroup['items'][number] {
  const isLitter = item.kind === 'litter'
  const path = isLitter ? litterPath(item.code) : petPath(item.code)
  const image = isLitter
    ? litterShareImagePath(item.code, item.coverId)
    : petShareImagePath(item.code, item.coverId)
  return {
    href: shareUrl(path, 'alert'),
    image: {
      src: new URL(image, APP_URL).toString(),
      alt: isLitter ? texts.litterAlt(item) : texts.petAlt(item),
    },
    name: item.name,
    detail: isLitter ? texts.litterDetail(item) : texts.petDetail(item),
    zone: zoneName(item.zone),
  }
}

/**
 * El correo de avisos de una persona (contracts §Correo): una parte por aviso con algo nuevo y
 * «Dejar de recibir» al pie, a la dirección de su cuenta. Si salió, lo que miró la corrida queda
 * cubierto; si no, el próximo trae todo desde el último que llegó (FR-021). Nunca lanza.
 */
export async function sendPetAlertMail(
  claim: AlertMailClaim,
  parts: AlertMailPart[],
  locale: string,
): Promise<boolean> {
  const { sent } = await deliverNotice(async () => {
    const to = await getAccountEmail(claim.userId)
    if (to === null) return { ok: false }
    const token = newLinkToken()
    await createUnsubscribeLink(claim.userId, hashLinkToken(token))
    const [t, words, texts] = await Promise.all([
      getTranslations({ locale, namespace: 'emails.pet_alerts' }),
      alertNameWords(locale),
      itemTexts(locale),
    ])
    const count = mailItemCount(parts)
    // Con un solo aviso, el botón lleva a su listado filtrado; con varios no hay uno solo que elegir.
    const [only] = parts
    const target = parts.length === 1 && only ? listingHref(only.filters) : LISTING_PATH
    return sendEmail({
      to,
      subject: t('subject', { count }),
      url: new URL(target, APP_URL).toString(),
      lang: locale,
      texts: {
        heading: t('heading', { count }),
        body: t('body', { count }),
        button: t('button'),
        fallback: t('fallback'),
        footer: t('footer', { app: APP_NAME }),
      },
      extras: {
        groups: parts.map((part) => ({
          title: alertName(part.filters, words),
          items: part.items.map((item) => itemOf(item, texts)),
          more: { label: t('more'), url: new URL(listingHref(part.filters), APP_URL).toString() },
        })),
        secondary: {
          label: t('unsubscribe'),
          url: new URL(unsubscribePath(token), APP_URL).toString(),
        },
      },
      headers: {
        'List-Unsubscribe': `<${new URL(`/api/avisos/dejar?t=${token}`, APP_URL).toString()}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
  })
  if (!sent) {
    await reportEmailFailure('avisos: no se pudo mandar')
    return false
  }
  // El correo ya salió: si no se pudo cerrar el período, mañana puede repetir lo de hoy.
  await markPetAlertsMailed(claim.userId, claim.runAt).catch(taskFailed(TASK, undefined))
  await trackAll([alertMailSentEvent(parts)], { visit: false })
  return true
}

/**
 * Los correos de avisos de la corrida de las 8 (research R5): reclama, reparte cada persona en sus
 * partes y manda de a uno. Lo que falla con una persona no frena a las demás (FR-025).
 */
export async function sendPetAlertMails(locale: string): Promise<void> {
  const claims = await claimPetAlertMail()
  for (const claim of claims) {
    const parts = alertMailParts(claim.alerts)
    if (parts.length === 0) continue
    // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
    await new Promise((resolve) => setTimeout(resolve, MAIL_SPACING_MS))
    // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
    await sendPetAlertMail(claim, parts, locale).catch(taskFailed(TASK, false))
  }
}
