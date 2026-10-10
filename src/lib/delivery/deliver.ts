import { after } from 'next/server'

const TIMEOUT_MS = 3000

// Lo que sale a un servicio de afuera nunca demora ni rompe lo que ve la persona (FR-026, FR-034):
// dentro de un pedido va después de responder; fuera de uno `after` lanza y se manda en el momento.
// Si el servicio no contesta en 3 s, o contesta mal, se pierde: reintentar frenaría a alguien (spec
// §Assumptions).
export function deliver(send: (signal: AbortSignal) => Promise<unknown>): void {
  const run = () =>
    Promise.resolve()
      .then(() => send(AbortSignal.timeout(TIMEOUT_MS)))
      .catch(() => undefined)
  try {
    after(run)
  } catch {
    void run()
  }
}
