import { getTranslations } from 'next-intl/server'
import type { VouchSheetTexts } from '@/components/vouches/vouch-sheet'
import type { VouchSlotTexts } from '@/components/vouches/vouch-slot'

// La confirmación de avalar o de retirar, con el nombre de la otra persona en el título: en «Mis avales»
// la hoja tapa la fila, y sin el nombre no se sabe qué aval se retira.
// Los errores nombran el botón, porque reintentar es tocarlo de nuevo (docs/10 §Principios 6).
export async function vouchSheetTexts(
  verb: 'give' | 'withdraw',
  name: string,
): Promise<VouchSheetTexts> {
  const t = await getTranslations('vouches.sheet')
  const errors = await getTranslations('vouches.errors')
  const confirm = verb === 'give' ? t('give_confirm') : t('withdraw_confirm')
  return {
    title: verb === 'give' ? t('give_title', { name }) : t('withdraw_title', { name }),
    body: verb === 'give' ? t('give_body') : t('withdraw_body'),
    confirm,
    cancel: t('cancel'),
    close: t('close'),
    offline: errors('offline', { action: confirm }),
    noResponse: errors('no_response', { action: confirm }),
  }
}

export async function vouchSlotTexts(name: string): Promise<VouchSlotTexts> {
  const t = await getTranslations('vouches.slot')
  const steps = await getTranslations('vouches.steps')
  const paused = await getTranslations('vouches.paused')
  return {
    vouch: t('vouch'),
    canVouchHint: t('can_vouch_hint'),
    vouching: t('vouching'),
    withdraw: t('withdraw'),
    reciprocal: t('reciprocal'),
    blocked: t('blocked'),
    cannotReceive: t('cannot_receive'),
    needsLevelTwo: t('needs_level_two'),
    inReview: t('in_review'),
    restoresLevelTwo: t('restores_level_two'),
    paused: { mine: paused('mine'), theirs: paused('theirs'), both: paused('both') },
    steps: {
      complete_profile: steps('complete_profile'),
      verify_phone: steps('verify_phone'),
      verify_identity: steps('verify_identity'),
    },
    giveSheet: await vouchSheetTexts('give', name),
    withdrawSheet: await vouchSheetTexts('withdraw', name),
  }
}
