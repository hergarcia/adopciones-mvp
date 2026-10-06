import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import type { ApplicationFormTexts } from '@/components/applications/application-form'
import type { QuestionTexts } from '@/components/applications/question-field'
import type { WithdrawApplicationTexts } from '@/components/applications/withdraw-application-dialog'
import { applicationView } from '@/lib/applications/application-view'
import { QUESTIONS, type Answers, type QuestionId } from '@/lib/applications/questionnaire'
import type { ApplicationSummary } from '@/lib/applications/types'
import { momentDayLabel } from '@/lib/moderation/day-label'

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
  const [t, errors, questions] = await Promise.all([
    getTranslations('applications.form'),
    getTranslations('applications.errors'),
    questionTexts(petName),
  ])
  return {
    questions,
    // Los de contacto bajan crudos: el fragmento lo pone el cliente.
    errors: Object.fromEntries(
      FORM_ERRORS.map((key) => [
        `applications.errors.${key}`,
        key.startsWith('contact_') ? String(errors.raw(key)) : errors(key, { name: petName }),
      ]),
    ),
    counts: {
      left: { one: t('chars_left_one'), many: String(t.raw('chars_left_many')) },
      over: { one: t('chars_over_one'), many: String(t.raw('chars_over_many')) },
    },
    submit: t('submit'),
    progress: String(t.raw('progress')),
    next: t('next'),
    back: t('back'),
    restored: t('draft_restored'),
    startOver: t('start_over'),
    links: { toMine: t('to_mine'), seeMine: t('see_mine'), toListing: t('to_listing') },
  }
}

/** Lo contestado en palabras, en el orden del cuestionario y solo lo que se contestó (FR-072). */
export async function answerItems(answers: Answers, petName: string) {
  const questions = await questionTexts(petName)
  return QUESTIONS.flatMap((question) => {
    const answer = answers[question.id]
    if (answer === undefined) return []
    const texts = questions[question.id]
    return [
      {
        id: question.id,
        question: texts?.label ?? question.id,
        answer: texts?.options?.[answer] ?? answer,
      },
    ]
  })
}

/** El sello, la fecha y el motivo de una cerrada, en palabras (research R6). */
export async function applicationRowTexts(application: ApplicationSummary) {
  const [t, locale] = await Promise.all([getTranslations('applications.mine'), getLocale()])
  const view = applicationView(application)
  const name = application.petName
  return {
    view,
    texts: {
      name,
      photoAlt: t('photo_alt', { name }),
      sentOn: t('sent_on', { date: momentDayLabel(application.sentAt, locale) }),
      stamp: t(`stamps.${view.unavailable ? 'unavailable' : view.status}`),
      reason: view.reason === null ? null : t(`reasons.${view.reason}`, { name }),
    },
  }
}

const WITHDRAW_ERRORS = ['already_withdrawn', 'closed', 'not_found', 'failed'] as const

/** La confirmación de retirar; en la lista del límite, el disparador corto. */
export async function withdrawTexts(
  petName: string,
  trigger: 'trigger' | 'trigger_short',
): Promise<WithdrawApplicationTexts> {
  const t = await getTranslations('applications.withdraw')
  return {
    trigger: t(trigger),
    title: t('title', { name: petName }),
    body: t('body'),
    confirm: t('confirm'),
    cancel: t('cancel'),
    close: t('close'),
    errors: Object.fromEntries(
      WITHDRAW_ERRORS.map((key) => [`applications.withdraw.errors.${key}`, t(`errors.${key}`)]),
    ),
  }
}
