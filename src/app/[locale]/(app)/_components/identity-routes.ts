import {
  APPLICATION_ID_PATTERN,
  applyPath,
  identityForApplicationPath,
  identityForPetPath,
} from '@/lib/applications/paths'
import { getMyApplication } from '@/lib/supabase/queries/applications'
import { exitDestination } from '@/lib/verification/exit-question'
import { NO_GATE } from '@/lib/verification/gate'
import { IDENTITY_NEW_PATH } from '@/app/[locale]/_components/identity-texts'

/** La solicitud de la marca, si trae un id; todavía sin confirmar que sea de quien entra. */
export function flaggedApplication(value: string | undefined): string | null {
  return value !== undefined && APPLICATION_ID_PATTERN.test(value) ? value : null
}

// La solicitud de la marca vale solo si es de quien entra, espera respuesta y tiene el pedido de
// quien publicó sin resolver (historia #257, research R7); si no, la pantalla es la de siempre.
export async function askedApplication(id: string | null): Promise<string | null> {
  if (id === null) return null
  const application = await getMyApplication(id).catch(() => null)
  return application?.status === 'sent' && application.identityAsk?.resolvedAt === null ? id : null
}

// Las direcciones de la pantalla según de dónde se vino. Desde Mi solicitud (#257), «Ahora no» y el
// pedido mandado vuelven a la solicitud. Desde «Quiero adoptar» (#63), el pedido recuerda el animal,
// «Ahora no» vuelve a él y, mandado, la pantalla del animal dice que está en revisión.
export function identityRoutes(applicationId: string | null, returnCode: string | null) {
  const leavePath = exitDestination('identity', { gate: NO_GATE, returnCode, applicationId })
  if (applicationId !== null) {
    return { newPath: identityForApplicationPath(applicationId), leavePath, sentPath: leavePath }
  }
  if (returnCode !== null) {
    return { newPath: identityForPetPath(returnCode), leavePath, sentPath: applyPath(returnCode) }
  }
  return { newPath: IDENTITY_NEW_PATH, leavePath, sentPath: undefined }
}
