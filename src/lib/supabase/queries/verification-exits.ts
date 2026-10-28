import {
  EXIT_LEVELS,
  EXIT_ORIGINS,
  EXIT_OUTCOMES,
  type ExitLevel,
  type ExitOrigin,
  type ExitOutcome,
} from '@/lib/verification/exit-question'
import { createServerSupabase } from '@/lib/supabase/server'
import { UUID } from './applications'
import { oneOf } from './pet-rows'

// «¿Qué te frena?» (historia #234). Todo va con la sesión: cada función de la base vuelve a
// preguntar quién es, y las tablas no se leen de otra forma (research R1).

/** Lo que contestan responder y seguir sin contestar: el origen sale del ticket, nunca del navegador. */
export type ExitResolution = {
  outcome: ExitOutcome
  level: ExitLevel | null
  origin: ExitOrigin | null
}

type ResolutionRow = { outcome: string; level: string | null; origin: string | null }

function resolutionOf(row: ResolutionRow): ExitResolution {
  return {
    outcome: oneOf(EXIT_OUTCOMES, row.outcome, 'resultado de la pregunta'),
    level: row.level === null ? null : oneOf(EXIT_LEVELS, row.level, 'nivel'),
    origin: row.origin === null ? null : oneOf(EXIT_ORIGINS, row.origin, 'origen'),
  }
}

/** Si «Ahora no» de ese nivel tiene que preguntar; false si la base falla: la pantalla queda como hoy. */
export async function verificationExitDue(level: ExitLevel): Promise<boolean> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('verification_exit_due', { p_level: level })
  return !error && data
}

/** Hace la pregunta y devuelve el ticket; null si no corresponde o si la base falló. */
export async function askVerificationExit(
  level: ExitLevel,
  origin: ExitOrigin,
): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('ask_verification_exit', {
    p_level: level,
    p_origin: origin,
  })
  return error ? null : data
}

/** Contestar; null si la base no contestó. */
export async function answerVerificationExit(input: {
  ticket: string
  option: string
  body: string | null
}): Promise<ExitResolution | null> {
  if (!UUID.test(input.ticket))
    return resolutionOf({ outcome: 'already', level: null, origin: null })
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('answer_verification_exit', {
    p_ticket: input.ticket,
    p_option: input.option,
    ...(input.body === null ? {} : { p_body: input.body }),
  })
  const row = data?.[0]
  if (error || row === undefined) return null
  return resolutionOf(row)
}

/** «Seguir sin contestar»; null si la base no contestó. */
export async function skipVerificationExit(ticket: string): Promise<ExitResolution | null> {
  if (!UUID.test(ticket)) return resolutionOf({ outcome: 'already', level: null, origin: null })
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('skip_verification_exit', { p_ticket: ticket })
  const row = data?.[0]
  if (error || row === undefined) return null
  return resolutionOf(row)
}
