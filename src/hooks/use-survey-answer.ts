'use client'

import { useState } from 'react'
import type { ActionResult } from '@/actions/result'
import { fillFragment } from '@/lib/forms/fill-fragment'
import { toFieldError } from '@/lib/schemas/field-error'
import { surveyAnswerSchema } from '@/lib/schemas/survey'
import type { SurveyMoment } from '@/lib/surveys/types'

type Action = (input: unknown) => Promise<ActionResult<null>>

type Options = {
  offerId: string
  moment: SurveyMoment
  answer: Action
  dismiss: Action
  /** Por clave de `surveys.errors`; el de contacto, crudo con `{fragment}`. */
  errorTexts: Record<string, string>
}

type Errors = { option?: string; body?: string; form?: string }

const FAILED = 'surveys.errors.failed'
const CONTACT = 'surveys.errors.contact'

// Responder o cerrar la encuesta. Lo elegido y lo escrito quedan ante cualquier error; el aviso
// sobre lo elegido o lo escrito se va al cambiarlo y se revisa de nuevo al tocar «Enviar».
export function useSurveyAnswer({ offerId, moment, answer, dismiss, errorTexts }: Options) {
  const [option, setOption] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState<'answer' | 'dismiss' | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [unsent, setUnsent] = useState(0)
  // La invitación a WhatsApp queda aunque el aviso de contacto se vaya: quien dejó su número quería
  // que le respondieran, y sacarlo del texto no cambia eso.
  const [offersSupport, setOffersSupport] = useState(false)
  const [done, setDone] = useState<'answered' | 'dismissed' | null>(null)

  function fail(field: keyof Errors, key: string, fragment?: string) {
    setErrors({ [field]: fillFragment(errorTexts[key] ?? errorTexts[FAILED] ?? '', fragment) })
    if (key === CONTACT) setOffersSupport(true)
  }

  async function run(kind: 'answer' | 'dismiss', input: Record<string, string>) {
    setErrors({})
    setBusy(kind)
    const result = await (kind === 'answer' ? answer : dismiss)(input).catch(() => null)
    setBusy(null)
    if (result === null) {
      setUnsent((attempt) => attempt + 1)
      return
    }
    setUnsent(0)
    if (result.ok) setDone(kind === 'answer' ? 'answered' : 'dismissed')
    else fail('form', result.error)
  }

  function send() {
    const input = { offerId, moment, option, body }
    const issue = surveyAnswerSchema.safeParse(input).error?.issues[0]
    if (issue === undefined) {
      void run('answer', input)
      return
    }
    const { key, values } = toFieldError(issue)
    const field = issue.path[0] === 'body' ? 'body' : issue.path[0] === 'option' ? 'option' : 'form'
    fail(field, key, values?.fragment)
  }

  function edit(field: 'option' | 'body', set: (value: string) => void) {
    return (value: string) => {
      set(value)
      setErrors((current) => (current[field] === undefined ? current : { form: current.form }))
    }
  }

  return {
    option,
    setOption: edit('option', setOption),
    body,
    setBody: edit('body', setBody),
    busy,
    errors,
    unsent,
    offersSupport,
    done,
    send,
    dismiss: () => void run('dismiss', { offerId, moment }),
  }
}
