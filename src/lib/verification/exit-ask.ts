import { trackAll } from '@/lib/analytics/track'
import { verificationExitAskedEvent } from '@/lib/analytics/verification-exit-events'
import { getMyApplication } from '@/lib/supabase/queries/applications'
import { askVerificationExit } from '@/lib/supabase/queries/verification-exits'
import { setExitTicket } from './exit-cookie'
import {
  askedApplicationOf,
  exitOrigin,
  exitPlaceOf,
  exitQuestionPath,
  withoutApplication,
  type ExitLevel,
  type ExitPlace,
} from './exit-question'

// La solicitud de la pantalla que se deja cuenta solo si es de quien sale (historia #257, FR-023):
// una ajena, o una que no se pudo leer, es como ninguna, para el origen y para la vuelta.
export async function confirmedExitPlace(
  level: ExitLevel,
  from: string | null,
): Promise<ExitPlace> {
  const place = exitPlaceOf(from)
  const id = askedApplicationOf(level, place)
  if (id === null) return place
  const mine = await getMyApplication(id).catch(() => null)
  return mine === null ? withoutApplication(level, place) : place
}

// Hace la pregunta al dejar un nivel desde la pantalla `from` (con su consulta) y devuelve a dónde
// ir para verla; null si no corresponde —ya se preguntó, otra pestaña ganó, ya verificó— o si la base
// falló. La comparten «Ahora no» y «Cancelar la verificación» (research R4).
export async function askExitQuestion(
  level: ExitLevel,
  from: string | null,
): Promise<string | null> {
  const origin = exitOrigin(level, await confirmedExitPlace(level, from))
  const ticket = await askVerificationExit(level, origin)
  if (ticket === null) return null

  await setExitTicket(level, ticket)
  await trackAll([verificationExitAskedEvent(level, origin)])
  return exitQuestionPath(level, from)
}
