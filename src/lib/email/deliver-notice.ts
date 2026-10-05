import type { SendOutcome } from './send-email'
import { withDeadline } from './with-deadline'

// Un aviso que acompaña a una decisión ya guardada (FR-031 de la historia #13): si el servicio de
// correo falla, lanza o pasa el plazo, la decisión vale igual. Nunca lanza; dice si salió para el
// log, y quien lo llama no mira ese valor para decidir su resultado.
export async function deliverNotice(send: () => Promise<SendOutcome>): Promise<{ sent: boolean }> {
  try {
    const outcome = await withDeadline(send())
    return { sent: outcome.ok }
  } catch {
    return { sent: false }
  }
}
