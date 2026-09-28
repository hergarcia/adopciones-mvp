import type { SendOutcome } from './send-email'

// Pasado un minuto sin respuesta del servicio de correo, el aviso cuenta como fallido (historia #25
// FR-010, historia #11 FR-026). El SDK no documenta una señal de aborto, así que es una carrera
// contra un temporizador.
const DEADLINE_MS = 60_000

export async function withDeadline(sending: Promise<SendOutcome>): Promise<SendOutcome> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<SendOutcome>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false }), DEADLINE_MS)
  })
  try {
    return await Promise.race([sending, late])
  } finally {
    clearTimeout(timer)
  }
}
