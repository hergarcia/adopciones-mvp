'use server'

import { reportFailure } from '@/lib/errors/report'
import { screenName } from '@/lib/errors/screen-name'
import { clientFailureSchema } from '@/lib/schemas/errors'
import type { ActionResult } from './result'

// Una falla que nació en el navegador y llegó a la pantalla de error sin pasar por el servidor
// (research R10 vía 4). Solo la pantalla, por su nombre, y el nombre del error: su mensaje puede
// traer lo que la persona escribió. Lo que no pasa el schema se descarta sin avisar, y la respuesta
// es la misma: nadie la espera.
export async function reportScreenFailure(input: unknown): Promise<ActionResult<null>> {
  const parsed = clientFailureSchema.safeParse(input)
  if (parsed.success) {
    const { path, name } = parsed.data
    reportFailure({ screen: screenName(path), step: 'open_screen', error: name })
  }
  return { ok: true, data: null }
}
