// El tope que se le cuenta a la persona vive en su navegador, no en la dirección. Escribir el
// correo de otra persona no puede revelar nada sobre ella (FR-006a), así que la cuenta regresiva
// que se muestra solo puede salir de los pedidos hechos desde este mismo navegador: información
// sobre sus propios actos.
export const MIN_SECONDS_BETWEEN_REQUESTS = 60
export const MAX_REQUESTS_PER_HOUR = 5
const HOUR_MS = 60 * 60 * 1000

export type WindowDecision = { allowed: true } | { allowed: false; waitSeconds: number }

// Ventana móvil: son cinco pedidos en los últimos sesenta minutos, no cinco por reloj. Así el
// «cuánto falta» es el tiempo real hasta que se libere el más viejo, y no hay un instante en que
// el cupo se reinicie de golpe (FR-006b).
export function checkWindow(previous: readonly Date[], now: Date): WindowDecision {
  const recent = previous
    .filter((at) => now.getTime() - at.getTime() < HOUR_MS)
    .sort((a, b) => a.getTime() - b.getTime())

  const last = recent.at(-1)
  if (last !== undefined) {
    const sinceLast = (now.getTime() - last.getTime()) / 1000
    if (sinceLast < MIN_SECONDS_BETWEEN_REQUESTS) {
      return { allowed: false, waitSeconds: Math.ceil(MIN_SECONDS_BETWEEN_REQUESTS - sinceLast) }
    }
  }

  if (recent.length >= MAX_REQUESTS_PER_HOUR) {
    // Con el cupo lleno hay al menos un pedido, así que `recent[0]` existe: una guarda acá sería
    // una condición que nunca es falsa.
    const freesAt = recent[0].getTime() + HOUR_MS
    return { allowed: false, waitSeconds: Math.ceil((freesAt - now.getTime()) / 1000) }
  }

  return { allowed: true }
}

// Lo que queda guardado en la cookie después de un pedido: los de la última hora más este.
export function recordRequest(previous: readonly Date[], now: Date): Date[] {
  return [...previous.filter((at) => now.getTime() - at.getTime() < HOUR_MS), now]
}
