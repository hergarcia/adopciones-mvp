import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import type { AnswerQuestionTexts } from '@/components/applications/answer-question-form'
import type { ApplicationFormTexts } from '@/components/applications/application-form'
import type { QuestionTexts } from '@/components/applications/question-field'
import type { WithdrawApplicationTexts } from '@/components/applications/withdraw-application-dialog'
import { answerWords } from '@/lib/applications/answer-words'
import { applicationView } from '@/lib/applications/application-view'
import { QUESTIONS, type Answers, type QuestionId } from '@/lib/applications/questionnaire'
import { heldApplicationView } from '@/lib/applications/held-view'
import type { ApplicationSummary, HeldApplication } from '@/lib/applications/types'
import { YOUNG_ADOPTED, YOUNG_GONE } from '@/lib/litters/young-gone'
import { calendarDayLabel, momentDayLabel } from '@/lib/moderation/day-label'

const FORM_ERRORS = [
  'choice_required',
  'text_required',
  'too_long',
  'contact_phone',
  'contact_email',
  'contact_web',
  'contact_social',
  'missing',
  'contact',
  'connection',
  'failed',
  'limit',
  'has_active',
  'unavailable',
  'not_receiving',
  'needs_phone',
  'needs_identity',
] as const

function nodeAt(source: unknown, ...path: string[]): unknown {
  return path.reduce<unknown>(
    (node, key) => (typeof node === 'object' && node !== null ? Reflect.get(node, key) : undefined),
    source,
  )
}

function textAt(source: unknown, ...path: string[]): string | undefined {
  const value = nodeAt(source, ...path)
  return typeof value === 'string' ? value : undefined
}

// Los textos de cada pregunta, con el nombre del animal en «¿Por qué Tobi?». La ayuda es optativa:
// solo las preguntas abiertas que la necesitan la tienen. Las opciones y la ayuda se leen crudas
// porque cada pregunta tiene las suyas, y no llevan variables.
async function questionTexts(petName: string): Promise<Partial<Record<QuestionId, QuestionTexts>>> {
  const [t, messages] = await Promise.all([getTranslations('applications'), getMessages()])
  return Object.fromEntries(
    QUESTIONS.map((question) => {
      const raw = nodeAt(messages, 'applications', 'questions', question.id)
      const options =
        question.kind === 'choice'
          ? Object.fromEntries(
              question.options.map((option) => [option, textAt(raw, 'options', option) ?? option]),
            )
          : undefined
      return [
        question.id,
        {
          label: t(`questions.${question.id}.label`, { name: petName }),
          help: textAt(raw, 'help'),
          options,
        },
      ]
    }),
  )
}

export async function applicationFormTexts(petName: string): Promise<ApplicationFormTexts> {
  const [t, errors, questions, litter] = await Promise.all([
    getTranslations('applications.form'),
    getTranslations('applications.errors'),
    questionTexts(petName),
    getTranslations('litters.page'),
  ])
  return {
    questions,
    // Los de contacto bajan crudos: el fragmento lo pone el cliente.
    errors: {
      ...Object.fromEntries(
        FORM_ERRORS.map((key) => [
          `applications.errors.${key}`,
          key.startsWith('contact_') ? String(errors.raw(key)) : errors(key, { name: petName }),
        ]),
      ),
      [YOUNG_GONE]: litter('young_gone'),
      [YOUNG_ADOPTED]: litter('young_adopted'),
    },
    counts: {
      left: { one: t('chars_left_one'), many: String(t.raw('chars_left_many')) },
      over: { one: t('chars_over_one'), many: String(t.raw('chars_over_many')) },
    },
    submit: t('submit'),
    progress: String(t.raw('progress')),
    next: t('next'),
    back: t('back'),
    review: {
      title: t('review_title'),
      change: t('change'),
      changeLabel: String(t.raw('change_label')),
    },
    restored: t('draft_restored'),
    startOver: t('start_over'),
    links: {
      toMine: t('to_mine'),
      seeMine: t('see_mine'),
      toListing: t('to_listing'),
      toLitter: litter('to_litter'),
    },
  }
}

/** Que sale sola al aprobarse la identidad y quién no la ve hasta entonces (historia #289). */
export async function heldLineText(publisherName: string | null): Promise<string> {
  const t = await getTranslations('applications.held')
  return publisherName === null ? t('line_no_publisher') : t('line', { publisher: publisherName })
}

/** El cuestionario para dejarla escrita: el botón, los errores al guardar y la vuelta (#289). */
export async function heldFormTexts(petName: string): Promise<ApplicationFormTexts> {
  const [base, t] = await Promise.all([
    applicationFormTexts(petName),
    getTranslations('applications.held'),
  ])
  return {
    ...base,
    submit: t('submit'),
    errors: {
      ...base.errors,
      'applications.errors.connection': t('errors.connection'),
      'applications.errors.failed': t('errors.failed'),
      'applications.held.errors.has_held': t('errors.has_held', { name: petName }),
      'applications.held.errors.no_review': t('errors.no_review'),
    },
    links: { ...base.links, toIdentity: t('errors.to_identity', { name: petName }) },
  }
}

/** Una que se dejó escrita, en la pared de Mis solicitudes: el sello, el día y el motivo (#289). */
export async function heldRowTexts(held: HeldApplication) {
  const [t, locale] = await Promise.all([getTranslations('applications.mine'), getLocale()])
  const view = heldApplicationView(held)
  const name = held.petName
  return {
    view,
    texts: {
      name,
      litter: held.litterName,
      photoAlt: t('photo_alt', { name }),
      sentOn: t('written_on', { date: calendarDayLabel(view.writtenDay, locale) }),
      stamp: t(`stamps.${view.stamp}`),
      reason: view.reason === null ? null : t(`reasons.${view.reason}`, { name }),
    },
  }
}

/** Lo contestado en palabras, en el orden del cuestionario y solo lo que se contestó (FR-072). */
export async function answerItems(answers: Answers, petName: string) {
  return answerWords(answers, await questionTexts(petName))
}

/** El sello, la fecha, el motivo de una cerrada y, de una cría, su camada, en palabras (research R6). */
export async function applicationRowTexts(application: ApplicationSummary) {
  const [t, locale] = await Promise.all([getTranslations('applications.mine'), getLocale()])
  const view = applicationView(application)
  const name = application.petName
  return {
    view,
    texts: {
      name,
      litter: application.litterName,
      photoAlt: t('photo_alt', { name }),
      sentOn: t('sent_on', { date: momentDayLabel(application.sentAt, locale) }),
      stamp: t(`stamps.${view.stamp}`),
      reason: view.reason === null ? null : t(`reasons.${view.reason}`, { name }),
      pending: application.adoption === 'pending' ? t('pending_commitment') : null,
    },
  }
}

const WITHDRAW_ERRORS = [
  'already_withdrawn',
  'rejected',
  'closed',
  'not_found',
  'released',
  'failed',
] as const

/** La confirmación de retirar; en la lista del límite, el disparador corto. */
export async function withdrawTexts(
  petName: string,
  trigger: 'trigger' | 'trigger_short',
  kind: 'application' | 'held' = 'application',
): Promise<WithdrawApplicationTexts> {
  const t = await getTranslations('applications.withdraw')
  return {
    trigger: t(trigger),
    title: t('title', { name: petName }),
    body: kind === 'held' ? t('held_body') : t('body'),
    confirm: t('confirm'),
    cancel: t('cancel'),
    close: t('close'),
    errors: Object.fromEntries(
      WITHDRAW_ERRORS.map((key) => [`applications.withdraw.errors.${key}`, t(`errors.${key}`)]),
    ),
  }
}

const ANSWER_ERRORS = [
  'empty',
  'too_long',
  'not_active',
  'not_found',
  'failed',
  'contact_phone',
  'contact_email',
  'contact_web',
  'contact_social',
] as const

/** Contestar la pregunta del publicador, desde Mi solicitud (FR-051). */
export async function answerQuestionTexts(): Promise<AnswerQuestionTexts> {
  const [t, form] = await Promise.all([
    getTranslations('applications.answer'),
    getTranslations('applications.form'),
  ])
  return {
    label: t('label'),
    contactLater: t('contact_later'),
    submit: t('submit'),
    unsent: t('unsent'),
    counts: {
      left: { one: form('chars_left_one'), many: String(form.raw('chars_left_many')) },
      over: { one: form('chars_over_one'), many: String(form.raw('chars_over_many')) },
    },
    // Los de contacto bajan crudos: el fragmento lo pone el cliente.
    errors: Object.fromEntries(
      ANSWER_ERRORS.map((key) => [
        `applications.answer.errors.${key}`,
        key.startsWith('contact_') ? String(t.raw(`errors.${key}`)) : t(`errors.${key}`),
      ]),
    ),
  }
}
