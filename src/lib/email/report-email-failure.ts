import { reportFailure } from '@/lib/errors/report'
import { requestScreen } from '@/lib/errors/request-screen'

/**
 * Un correo que no salió llega al registro de errores (FR-031): con la pantalla de quien lo pidió,
 * o ninguna desde una tarea. Solo qué correo y qué pasó, nunca la dirección ni a quién: la causa
 * del servicio puede traer la casilla, así que no viaja.
 */
export async function reportEmailFailure(what: string): Promise<void> {
  reportFailure({ screen: await requestScreen(), step: 'send_email', error: what })
}
