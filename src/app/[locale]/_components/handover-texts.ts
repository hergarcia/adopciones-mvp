import { getLocale, getTranslations } from 'next-intl/server'
import type { HandoverChoiceTexts } from '@/components/adoptions/handover-form'
import type { HandoverSummaryTexts } from '@/components/adoptions/handover-summary'
import { commitmentClauses } from '@/lib/adoptions/commitment'
import type { AdoptionRow, HandoverCandidate, HandoverPet } from '@/lib/adoptions/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import type { Sex } from '@/lib/pets/options'
import { badgeLabel } from './level-texts'

// Los textos de la entrega y del compromiso (historia #67), armados en el servidor: las
// componentes reciben todo traducido.

type CommitmentNames = { pet: string; sex: Sex; adopter: string; publisher: string }

/** Las cláusulas del compromiso con los tres nombres, y la nota de «acuerdo de palabra». */
export async function commitmentTexts(names: CommitmentNames, includesNeuter: boolean) {
  const t = await getTranslations('adoptions.commitment.clauses')
  const values = { ...names }
  const clauses = commitmentClauses({ includesNeuter }).map((clause) => t(clause, values))
  return { clauses: clauses.slice(0, -1), note: clauses.at(-1) ?? '' }
}

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

/** La elegida, para quien lo dio: a quién y cuándo, y el compromiso con su estado (FR-042). */
export async function handoverSummaryTexts(adoption: AdoptionRow): Promise<HandoverSummaryTexts> {
  const [line, title, locale] = await Promise.all([
    getTranslations('adoptions.line'),
    getTranslations('adoptions.commitment'),
    getLocale(),
  ])
  const person = adoption.adopterName ?? ''
  const sex = adoption.petSex
  if (adoption.declinedAt !== null) {
    return { given: line('declined', { sex, person }), commitment: null }
  }
  const commitment = await commitmentTexts(
    {
      pet: adoption.petName,
      sex,
      adopter: person,
      publisher: adoption.publisherName ?? '',
    },
    adoption.includesNeuter,
  )
  return {
    given: line('given', { sex, person, date: momentDayLabel(adoption.markedAt, locale) }),
    commitment: {
      title: title('title'),
      ...commitment,
      state:
        adoption.adopterAcceptedAt === null
          ? line('pending', { person })
          : line('accepted', { date: momentDayLabel(adoption.adopterAcceptedAt, locale) }),
    },
  }
}
