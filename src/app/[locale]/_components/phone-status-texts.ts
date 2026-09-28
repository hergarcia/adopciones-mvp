import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import type { PhoneNumberCardTexts } from '@/components/verification/phone-number-card'
import type { PhoneStatusCardTexts } from '@/components/verification/phone-status-card'
import type { VerifyPhoneScreenTexts } from '@/components/verification/verify-phone-screen'
import type { GateReason } from '@/lib/verification/gate'
import { lostDayLabel } from '@/lib/verification/lost-notice'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import { gateTexts } from './verification-texts'

// Los textos que dependen del estado del teléfono: la fecha del nivel y qué se cancela.

// "Nivel 1 desde el 20 de septiembre de 2026": una fecha, no "hace 3 días", en hora de Uruguay. En
// nivel 2 se calla: el nivel lo dice una sola vez «Tu identidad» (FR-024 de la historia #11).
async function levelSince(status: PhoneStatus, levelTwo: boolean): Promise<string | null> {
  if (status.kind !== 'verified' || levelTwo) return null
  const t = await getTranslations('verification.status')
  const format = await getFormatter()
  return t('level_since', { date: format.dateTime(status.since, { dateStyle: 'long' }) })
}

async function phoneCardTexts(
  status: PhoneStatus,
  levelTwo = false,
): Promise<PhoneNumberCardTexts> {
  const s = await getTranslations('verification.status')
  return {
    verifiedStamp: s('verified_stamp'),
    levelSince: await levelSince(status, levelTwo),
    pendingStamp: s('pending_stamp'),
    pendingBody: s('pending_body'),
    pendingChangeBody: String(s.raw('pending_change_body')),
  }
}

// El botón dice qué se cancela: la verificación entera o solo el cambio, como después el aviso.
async function cancelLabel(status: PhoneStatus): Promise<string> {
  const t = await getTranslations('verification.screen')
  return status.kind === 'pending_change' ? t('cancel_change') : t('cancel_first')
}

export async function verifyScreenTexts(
  status: PhoneStatus,
  reason: GateReason | null,
): Promise<VerifyPhoneScreenTexts> {
  const t = await getTranslations('verification.screen')
  const privacy = await getTranslations('verification.privacy')
  const gate = await gateTexts(reason)
  return {
    title: t('title'),
    lead: t('lead'),
    titlePending: t('title_pending'),
    titleVerified: t('title_verified'),
    numberLabelNew: t('number_label_new'),
    finish: t('finish'),
    cancel: await cancelLabel(status),
    correctTitle: t('correct_title'),
    changeTitle: t('change_title'),
    changeWarning: t('change_warning'),
    notNow: t('not_now'),
    privacy: { private: privacy('private'), revealed: privacy('revealed') },
    card: await phoneCardTexts(status),
    gate: gate === null ? null : { title: gate.title, lead: gate.lead },
  }
}

async function lostTexts(lostOn: string | null): Promise<PhoneStatusCardTexts['lost']> {
  if (lostOn === null) return null
  const t = await getTranslations('verification.lost')
  const date = lostDayLabel(lostOn, await getLocale())
  return { stamp: t('stamp'), body: t('body', { date }), short: t('short', { date }) }
}

export async function statusCardTexts(
  status: PhoneStatus,
  lostOn: string | null,
  levelTwo: boolean,
): Promise<PhoneStatusCardTexts> {
  const s = await getTranslations('verification.status')
  const t = await getTranslations('verification.screen')
  return {
    label: s('title'),
    card: await phoneCardTexts(status, levelTwo),
    change: s('change'),
    finish: t('finish'),
    correct: s('correct'),
    cancel: await cancelLabel(status),
    noneValue: s('none_value'),
    noneBody: s('none_body'),
    noneAction: s('none_action'),
    lost: await lostTexts(lostOn),
  }
}
