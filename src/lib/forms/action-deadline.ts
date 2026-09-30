// Cómo terminó una Server Action llamada desde el navegador: con su resultado, rechazada (sin red,
// la llamada rechaza) o sin respuesta dentro del plazo.
export type ActionAttempt<T> =
  { kind: 'result'; result: T } | { kind: 'threw' } | { kind: 'timeout' }

// Una Server Action no se puede cancelar: el plazo no aborta el pedido, deja de esperarlo. Sin el
// `catch`, el rechazo sube al límite de error y la pantalla se reemplaza por «Algo se rompió».
export async function raceDeadline<T>(pending: Promise<T>, ms: number): Promise<ActionAttempt<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<ActionAttempt<T>>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'timeout' }), ms)
  })
  try {
    return await Promise.race([
      pending.then((result): ActionAttempt<T> => ({ kind: 'result', result })),
      deadline,
    ])
  } catch {
    return { kind: 'threw' }
  } finally {
    clearTimeout(timer)
  }
}
