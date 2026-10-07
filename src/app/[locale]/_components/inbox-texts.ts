import { getLocale, getTranslations } from 'next-intl/server'
import { daysWaiting } from '@/lib/applications/days-waiting'
import { publisherApplicationView } from '@/lib/applications/publisher-view'
import type {
  Applicant,
  InboxPet,
  PetApplicationRow,
  PublisherApplication,
  PublisherClose,
} from '@/lib/applications/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { zoneName } from '@/lib/zones/zone-name'
import { answerItems } from './application-texts'
import { badgeLabel } from './level-texts'

// Los textos de las pantallas del publicador (historia #65), armados en el servidor: las
// componentes reciben todo traducido.

/** Una tarjeta de Solicitudes: el nombre, «2 nuevas» solo si hay y cuántas esperan. */
export async function inboxPetTexts(pet: InboxPet) {
  const t = await getTranslations('inbox.list')
  return {
    name: pet.name,
    photoAlt: t('photo_alt', { name: pet.name }),
    fresh: pet.fresh > 0 ? t('fresh', { count: pet.fresh }) : null,
    waiting: t('waiting', { count: pet.waiting }),
  }
}

/** «Nivel 1 · Pocitos» y la chapita en voz alta, con o sin el enlace a la explicación. */
export async function applicantTexts(applicant: Applicant, linked: boolean) {
  const t = await getTranslations('inbox.detail')
  return {
    name: applicant.name,
    photoAlt: t('photo_alt', { name: applicant.name }),
    badge: applicant.level === 0 ? '' : await badgeLabel(applicant.level, linked),
    who: `${t('level', { level: applicant.level })} · ${zoneName(applicant.zone)}`,
  }
}

/** Un renglón de la carpeta de un animal: quién, tres respuestas, cuándo llegó y su sello. */
export async function applicationCardTexts(row: PetApplicationRow, petName: string, now: Date) {
  const [t, stamps, locale] = await Promise.all([
    getTranslations('inbox.card'),
    getTranslations('inbox.stamps'),
    getLocale(),
  ])
  const view = publisherApplicationView(row)
  const answers = await answerItems(row.keyAnswers, petName)
  const arrived = t('arrived', { date: momentDayLabel(row.sentAt, locale) })
  const days = view.waiting ? t('days', { days: daysWaiting(new Date(row.sentAt), now) }) : null
  const who = row.applicant === null ? null : await applicantTexts(row.applicant, false)
  return {
    view,
    texts: {
      name: who?.name ?? '',
      photoAlt: who?.photoAlt ?? '',
      badge: who?.badge ?? '',
      who: who?.who ?? '',
      answers: answers.map((item) => item.answer).join(' · '),
      arrived: days === null ? arrived : `${arrived} · ${days}`,
      stamp: stamps(view.stamp),
    },
  }
}

/** Por qué se cerró, del lado del publicador, en una línea (FR-042, FR-043). */
export async function closeLine(
  close: PublisherClose,
  names: { applicant: string; pet: string; sex: string | null },
): Promise<string> {
  const t = await getTranslations('inbox.closes')
  return t(close, { name: names.applicant, pet: names.pet, sex: names.sex ?? 'male' })
}

// El estado al lado del sello: desde cuándo espera, o cuándo se aceptó.
function sinceText(
  application: PublisherApplication,
  t: Awaited<ReturnType<typeof getTranslations<'inbox.detail'>>>,
  locale: string,
): string | null {
  if (application.status === 'sent') {
    return t('since', { days: daysWaiting(new Date(application.sentAt), new Date()) })
  }
  if (application.status === 'accepted' && application.acceptedAt !== null) {
    return t('accepted_on', { date: momentDayLabel(application.acceptedAt, locale) })
  }
  return null
}

/** El estado de una solicitud para el publicador: el sello, desde cuándo, por qué se cerró y cuándo llegó. */
export async function publisherStateTexts(application: PublisherApplication) {
  const [t, stamps, locale] = await Promise.all([
    getTranslations('inbox.detail'),
    getTranslations('inbox.stamps'),
    getLocale(),
  ])
  const view = publisherApplicationView({ ...application, isNew: false, waitingQuestion: false })
  const names = {
    applicant: application.applicant?.name ?? '',
    pet: application.petName,
    sex: application.petSex,
  }
  return {
    tone: view.tone,
    texts: {
      stamp: stamps(view.stamp),
      since: sinceText(application, t, locale),
      close: view.close === null ? null : await closeLine(view.close, names),
      arrived: t('arrived', {
        date: momentDayLabel(application.sentAt, locale),
        pet: application.petName,
      }),
    },
  }
}
