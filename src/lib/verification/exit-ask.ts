import { trackAll } from '@/lib/analytics/track'
import { verificationExitAskedEvent } from '@/lib/analytics/verification-exit-events'
import { askVerificationExit } from '@/lib/supabase/queries/verification-exits'
import { setExitTicket } from './exit-cookie'
import { exitOrigin, exitPlaceOf, exitQuestionPath, type ExitLevel } from './exit-question'

// Hace la pregunta al dejar un nivel desde la pantalla `from` (con su consulta) y devuelve a dónde
// ir para verla; null si no corresponde —ya se preguntó, otra pestaña ganó, ya verificó— o si la base
// falló. La comparten «Ahora no» y «Cancelar la verificación» (research R4).
export async function askExitQuestion(
  level: ExitLevel,
  from: string | null,
): Promise<string | null> {
  const origin = exitOrigin(level, exitPlaceOf(from))
  const ticket = await askVerificationExit(level, origin)
  if (ticket === null) return null

  await setExitTicket(level, ticket)
  await trackAll([verificationExitAskedEvent(level, origin)])
  return exitQuestionPath(level, from)
}
