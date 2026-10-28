'use server'

import { redirect } from 'next/navigation'
import { trackAll } from '@/lib/analytics/track'
import {
  verificationExitAnsweredEvent,
  verificationExitAskedEvent,
  verificationExitSkippedEvent,
} from '@/lib/analytics/verification-exit-events'
import { signInWithNext } from '@/lib/auth/next-destination'
import {
  verificationExitAnswerSchema,
  verificationExitSkipSchema,
} from '@/lib/schemas/verification-exit'
import { getSessionUser } from '@/lib/supabase/queries/session'
import {
  answerVerificationExit as answerRecord,
  askVerificationExit,
  skipVerificationExit as skipRecord,
} from '@/lib/supabase/queries/verification-exits'
import { clearExitTicket, readExitTicket, setExitTicket } from '@/lib/verification/exit-cookie'
import {
  EXIT_LEVELS,
  exitDestination,
  exitOrigin,
  exitPlaceOf,
  exitQuestionPath,
  type ExitLevel,
} from '@/lib/verification/exit-question'
import { validPath } from '@/lib/verification/gate'
import { failed, type ActionResult } from './result'

const SESSION = 'verification.exit.errors.session'
const FAILED = 'verification.exit.errors.failed'
const PROFILE_PATH = '/mi-perfil'

function levelOf(value: FormDataEntryValue | null): ExitLevel | null {
  return EXIT_LEVELS.find((level) => level === value) ?? null
}

// «Ahora no» que pregunta (research R4), desde un `<form action>` así funciona sin JavaScript. La
// puerta y el animal salen de la pantalla que postea, nunca de un campo propio. Si no corresponde
// preguntar —ya se preguntó, otra pestaña ganó— o la base falla, sale al destino: salir nunca se
// traba.
export async function leaveVerification(form: FormData): Promise<never> {
  const asked = form.get('from')
  const from = validPath(typeof asked === 'string' ? asked : null)
  const level = levelOf(form.get('level'))
  if (level === null) redirect(from ?? PROFILE_PATH)
  const place = exitPlaceOf(from)
  const destination = exitDestination(level, place)

  if ((await getSessionUser()) === null) redirect(signInWithNext(from ?? destination))

  const origin = exitOrigin(level, place)
  const ticket = await askVerificationExit(level, origin)
  if (ticket === null) redirect(destination)

  await setExitTicket(level, ticket)
  await trackAll([verificationExitAskedEvent(level, origin)])
  redirect(exitQuestionPath(level, from))
}

// Una opción o «Enviar» de «Otra cosa» (FR-008 a FR-014). Lo que ya había llegado —doble toque,
// otra pestaña, el reintento después de un corte— termina como un envío, sin medir otra vez: el
// ticket ya no está.
export async function answerVerificationExit(input: unknown): Promise<ActionResult<null>> {
  const parsed = verificationExitAnswerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? FAILED }
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }

  const { level, option, body } = parsed.data
  const ticket = await readExitTicket(level)
  if (ticket === null) return { ok: true, data: null }

  try {
    const resolution = await answerRecord({ ticket, option, body })
    if (resolution === null) return failed(FAILED, 'answer_verification_exit')
    if (resolution.outcome === 'invalid') {
      return { ok: false, error: 'verification.exit.errors.option' }
    }
    await clearExitTicket(level)
    if (resolution.outcome === 'answered' && resolution.origin !== null) {
      await trackAll([
        verificationExitAnsweredEvent({
          level,
          option,
          origin: resolution.origin,
          wrote: body !== null,
        }),
      ])
    }
    return { ok: true, data: null }
  } catch (cause) {
    return failed(FAILED, 'answer_verification_exit', cause)
  }
}

// «Seguir sin contestar». El cliente sale al destino aunque esto falle: una cuenta de seguidas sin
// contestar perdida por un corte vale menos que trabar a quien se quiere ir (research R3).
export async function skipVerificationExit(input: unknown): Promise<ActionResult<null>> {
  const parsed = verificationExitSkipSchema.safeParse(input)
  if (!parsed.success) return { ok: true, data: null }
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }

  const { level } = parsed.data
  const ticket = await readExitTicket(level)
  if (ticket === null) return { ok: true, data: null }

  try {
    const resolution = await skipRecord(ticket)
    if (resolution === null) return failed(FAILED, 'skip_verification_exit')
    await clearExitTicket(level)
    if (resolution.outcome === 'skipped' && resolution.origin !== null) {
      await trackAll([verificationExitSkippedEvent(level, resolution.origin)])
    }
    return { ok: true, data: null }
  } catch (cause) {
    return failed(FAILED, 'skip_verification_exit', cause)
  }
}
