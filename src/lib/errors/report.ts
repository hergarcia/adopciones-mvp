import { deliver, DELIVERY_TIMEOUT_MS } from '@/lib/delivery/deliver'
import { shouldDeliver } from '@/lib/delivery/should-deliver'
import { optionalEnv } from '@/lib/env'
import { failureEnvelope, failureException, type Failure } from './envelope'

type Sentry = { VERCEL_ENV: string; key: string }

function sentry(): Sentry | null {
  const env = { VERCEL_ENV: optionalEnv('VERCEL_ENV'), key: optionalEnv('SENTRY_DSN') }
  return shouldDeliver(env) ? env : null
}

async function post(failure: Failure, { VERCEL_ENV, key }: Sentry, signal: AbortSignal) {
  const { url, headers, body } = failureEnvelope({
    ...failure,
    environment: VERCEL_ENV,
    dsn: key,
    now: new Date(),
  })
  await fetch(url, { method: 'POST', headers, body, signal })
}

// En local, en CI y en las pruebas no sale nada (FR-027): queda en el registro del servidor, limpio
// como lo que saldría.
function log({ screen, step, error }: Failure) {
  const { type, value } = failureException(step, error)
  console.error(`[falla] ${screen} · ${step} · ${type}${value === '' ? '' : `: ${value}`}`)
}

/**
 * Avisa una falla al registro de errores después de responder: la persona nunca espera al registro,
 * y si no contesta el aviso se pierde (FR-034).
 */
export function reportFailure(failure: Failure): void {
  const target = sentry()
  if (target === null) return log(failure)
  deliver((signal) => post(failure, target, signal))
}

/**
 * Para el `.catch` de una tarea: avisa la falla y sigue con `fallback`, como antes. Una tarea no
 * pasa en ninguna pantalla y su paso es su nombre (spec §Edge Cases «Una falla en una tarea»).
 */
export function taskFailed<T>(task: string, fallback: T): (cause: unknown) => T {
  return (cause) => {
    reportFailure({ screen: 'no_screen', step: task, error: cause })
    return fallback
  }
}

/**
 * `reportFailure`, esperada, para `onRequestError`: Next pide esperar ahí lo que se manda (research R10
 * vía 1). Con el mismo tope de espera, y sin lanzar nunca.
 */
export async function reportFailureNow(failure: Failure): Promise<void> {
  const target = sentry()
  if (target === null) return log(failure)
  try {
    await post(failure, target, AbortSignal.timeout(DELIVERY_TIMEOUT_MS))
  } catch {
    // El registro no contestó: el aviso se pierde, como cualquier otro.
  }
}
