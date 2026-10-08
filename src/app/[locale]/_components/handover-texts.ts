import { getLocale, getTranslations } from 'next-intl/server'
import type { HandoverChoiceTexts } from '@/components/adoptions/handover-form'
import type { AdoptionPanelTexts } from '@/components/adoptions/adoption-panel'
import type { DeclineAdoptionTexts } from '@/components/adoptions/decline-adoption-dialog'
import type { HandoverSummaryTexts } from '@/components/adoptions/handover-summary'
import { commitmentTexts } from '@/lib/adoptions/commitment-texts'
import type { AdoptionRow, HandoverCandidate, HandoverPet } from '@/lib/adoptions/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { badgeLabel } from './level-texts'

// Los textos de la entrega y del compromiso (historia #67), armados en el servidor: las
// componentes reciben todo traducido.

/** Lo que se lee y se toca al elegir a una persona, con su nombre (FR-003, FR-004). */
export async function handoverChoiceTexts(
  pet: HandoverPet,
  person: string,
): Promise<HandoverChoiceTexts> {
  const t = await getTranslations('adoptions.handover')
  const confirm = t('confirm_site', { sex: pet.sex, person })
  const commitment = await commitmentTexts(
    { pet: pet.name, sex: pet.sex, adopter: person, publisher: pet.publisherName },
    !pet.isNeutered,
    await getLocale(),
  )
  return {
    ...commitment,
    confirm,
    failures: {
      offline: t('errors.offline', { action: confirm }),
      no_response: t('errors.failed', { action: confirm }),
    },
    refusals: {
      gone: t('errors.gone', { person }),
      you_blocked: t('errors.you_blocked', { person }),
      revoked: t('errors.revoked', { person }),
    },
  }
}

/** El renglón de una aceptada: su nombre, la chapita en voz alta y cuándo se aceptó. */
export async function handoverCandidateTexts(candidate: HandoverCandidate) {
  const [t, locale] = await Promise.all([getTranslations('adoptions.handover'), getLocale()])
  return {
    name: candidate.name,
    photoAlt: t('photo_alt', { person: candidate.name }),
    badge: candidate.level === 0 ? '' : await badgeLabel(candidate.level, false),
    acceptedOn:
      candidate.acceptedAt === null
        ? null
        : t('accepted_on', { date: momentDayLabel(candidate.acceptedAt, locale) }),
  }
}

// El día en que aceptó cada una, desde quien mira (FR-014): «Vos lo aceptaste» para la propia y el
// nombre de hoy para la otra; lo pendiente, «Compromiso pendiente» a quien le toca y con el nombre a
// quien lo dio.
async function commitmentDatesTexts(adoption: AdoptionRow, locale: string) {
  const [dates, line] = await Promise.all([
    getTranslations('adoptions.commitment.dates'),
    getTranslations('adoptions.line'),
  ])
  const mine = adoption.side
  const said = (side: AdoptionRow['side'], person: string | null, at: string) => {
    const date = momentDayLabel(at, locale)
    return side === mine ? dates('you', { date }) : dates('other', { person: person ?? '', date })
  }
  const accepted = [said('publisher', adoption.publisherName, adoption.markedAt)]
  if (adoption.adopterAcceptedAt !== null) {
    accepted.push(said('adopter', adoption.adopterName, adoption.adopterAcceptedAt))
  }
  const pending =
    adoption.adopterAcceptedAt !== null
      ? null
      : mine === 'adopter'
        ? dates('pending')
        : line('pending', { person: adoption.adopterName ?? '' })
  return { accepted, pending }
}

function commitmentOf(adoption: AdoptionRow, locale: string) {
  return commitmentTexts(
    {
      pet: adoption.petName,
      sex: adoption.petSex,
      adopter: adoption.adopterName ?? '',
      publisher: adoption.publisherName ?? '',
    },
    adoption.includesNeuter,
    locale,
  )
}

/** La elegida, para quien lo dio: a quién y cuándo, y el compromiso con sus fechas (FR-042). */
export async function handoverSummaryTexts(adoption: AdoptionRow): Promise<HandoverSummaryTexts> {
  const [line, title, locale] = await Promise.all([
    getTranslations('adoptions.line'),
    getTranslations('adoptions.commitment'),
    getLocale(),
  ])
  const person = adoption.adopterName ?? ''
  const sex = adoption.petSex
  if (adoption.declinedAt !== null) {
    return { given: line('declined', { sex, person }), ended: null, commitment: null }
  }
  const [commitment, dates] = await Promise.all([
    commitmentOf(adoption, locale),
    commitmentDatesTexts(adoption, locale),
  ])
  return {
    given: line('given', { sex, person, date: momentDayLabel(adoption.markedAt, locale) }),
    ended: adoption.endedAt === null ? null : line('ended'),
    commitment: { title: title('title'), ...commitment, dates },
  }
}

/** La adopción en Mi solicitud, para quien adoptó (FR-041): el compromiso, sus fechas y aceptar. */
export async function adoptionPanelTexts(adoption: AdoptionRow): Promise<AdoptionPanelTexts> {
  const [panel, commitment, locale] = await Promise.all([
    getTranslations('adoptions.panel'),
    getTranslations('adoptions.commitment'),
    getLocale(),
  ])
  const name = adoption.petName
  const [text, dates, decline] = await Promise.all([
    commitmentOf(adoption, locale),
    commitmentDatesTexts(adoption, locale),
    declineTexts(adoption),
  ])
  return {
    title: panel('title', { name }),
    given: panel('given', {
      publisher: adoption.publisherName ?? '',
      sex: adoption.petSex,
      date: momentDayLabel(adoption.markedAt, locale),
    }),
    ended: adoption.endedAt === null ? null : panel('ended', { name }),
    commitmentTitle: commitment('title'),
    ...text,
    dates,
    accept: {
      accept: commitment('accept'),
      failures: {
        offline: commitment('errors.offline'),
        no_response: commitment('errors.failed'),
        closed: commitment('errors.closed'),
        not_found: commitment('errors.not_found'),
      },
    },
    decline,
  }
}

const DECLINE_ERRORS = ['closed', 'not_found', 'failed'] as const

async function declineTexts(adoption: AdoptionRow): Promise<DeclineAdoptionTexts> {
  const t = await getTranslations('adoptions.decline')
  const values = {
    name: adoption.petName,
    sex: adoption.petSex,
    publisher: adoption.publisherName ?? '',
  }
  return {
    trigger: t('trigger', values),
    title: t('title', values),
    body: t('body', values),
    confirm: t('confirm', values),
    cancel: t('cancel'),
    close: t('close'),
    errors: Object.fromEntries(
      DECLINE_ERRORS.map((key) => [`adoptions.decline.errors.${key}`, t(`errors.${key}`, values)]),
    ),
  }
}
