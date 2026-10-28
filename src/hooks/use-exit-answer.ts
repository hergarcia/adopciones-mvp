'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/actions/result'
import { fillFragment } from '@/lib/forms/fill-fragment'
import { toFieldError } from '@/lib/schemas/field-error'
import { verificationExitAnswerSchema } from '@/lib/schemas/verification-exit'
import type { ExitLevel } from '@/lib/verification/exit-question'

type Action = (input: unknown) => Promise<ActionResult<null>>

export type ExitBusy =
  { kind: 'option'; option: string } | { kind: 'other' } | { kind: 'skip' } | null

type Options = {
  level: ExitLevel
  destination: string
  answer: Action
  skip: Action
  /** Por clave de `verification.exit.errors`; el de contacto, crudo con `{fragment}`. */
  errorTexts: Record<string, string>
}

const FAILED = 'verification.exit.errors.failed'
const BODY_ERRORS = new Set([
  'verification.exit.errors.too_long',
  'verification.exit.errors.contact',
])

// Mandar una opción de «¿Qué te frena?» o seguir sin contestar, y salir al destino. Lo elegido y lo
// escrito quedan ante cualquier error; «Seguir sin contestar» sale aunque la acción falle.
export function useExitAnswer({ level, destination, answer, skip, errorTexts }: Options) {
  const router = useRouter()
  const [chosen, setChosen] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState<ExitBusy>(null)
  const [leaving, setLeaving] = useState(false)
  const [errors, setErrors] = useState<{ body?: string; form?: string }>({})
  const [unsent, setUnsent] = useState(0)

  function message(key: string, fragment?: string): string {
    return fillFragment(errorTexts[key] ?? errorTexts[FAILED] ?? '', fragment)
  }

  function leave() {
    setLeaving(true)
    router.replace(destination)
  }

  async function send(option: string, withBody: boolean) {
    const input = { level, option, body: withBody ? body : '' }
    const issue = verificationExitAnswerSchema.safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      const { key, values } = toFieldError(issue)
      const text = message(key, values?.fragment)
      setErrors(issue.path[0] === 'body' ? { body: text } : { form: text })
      return
    }
    setErrors({})
    setChosen(option)
    setBusy(withBody ? { kind: 'other' } : { kind: 'option', option })
    const result = await answer(input).catch(() => null)
    setBusy(null)
    if (result === null) {
      setUnsent((attempt) => attempt + 1)
      return
    }
    setUnsent(0)
    if (result.ok) return leave()
    const text = message(result.error)
    setErrors(BODY_ERRORS.has(result.error) ? { body: text } : { form: text })
  }

  async function goOn() {
    setBusy({ kind: 'skip' })
    await skip({ level }).catch(() => null)
    leave()
  }

  return {
    chosen,
    body,
    setBody,
    busy,
    errors,
    unsent,
    disabled: busy !== null || leaving,
    send: (option: string, withBody = false) => void send(option, withBody),
    goOn: () => void goOn(),
  }
}
