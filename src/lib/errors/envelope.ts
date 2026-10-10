import { scrub } from './scrub'

export type Failure = {
  /** La pantalla por su nombre (`screenName`), o `no_screen` desde una tarea. */
  screen: string
  /** Lo que se estaba haciendo, en inglés: `open_screen`, `request_code`, el nombre de la tarea. */
  step: string
  /** Lo que falló: un `Error`, o una descripción que no lleva datos de nadie. */
  error?: unknown
}

type Frame = { filename: string; function: string; lineno: number; colno: number }

// Un marco de V8: `at función (archivo:línea:columna)`, o sin la función cuando es anónima.
const FRAME = /^\s*at (?:(.+?) \()?(.+):(\d+):(\d+)/u

// La ruta desde el proyecto: la carpeta de la máquina o de Vercel no dice nada que sirva. Sin
// ninguna de esas carpetas (`node:internal/…`), la ruta entera: `search` da -1 y se corta desde 0.
const PROJECT_ROOT = /\/(?:\.next|src|node_modules)\//u

function relativeFile(file: string): string {
  const path = file.replaceAll('\\', '/')
  return path.slice(path.search(PROJECT_ROOT) + 1)
}

// Del más viejo al más nuevo, como los lee Sentry; solo dónde, nunca las variables ni el código.
function framesOf(stack: string): Frame[] {
  return stack
    .split('\n')
    .flatMap((line): Frame[] => {
      const match = FRAME.exec(line)
      if (match === null) return []
      const [, name, file, lineno, colno] = match
      return [
        {
          filename: relativeFile(file),
          function: name ?? '?',
          lineno: Number(lineno),
          colno: Number(colno),
        },
      ]
    })
    .reverse()
}

/** Qué falló, como lo lee Sentry: el nombre y el mensaje limpio de un `Error` con su pila, o el paso y la descripción. */
export function failureException(step: string, error: unknown) {
  if (!(error instanceof Error)) {
    return { type: step, value: scrub(typeof error === 'string' ? error : '') }
  }
  const frames = error.stack === undefined ? [] : framesOf(error.stack)
  return {
    type: error.name,
    value: scrub(error.message),
    ...(frames.length === 0 ? {} : { stacktrace: { frames } }),
  }
}

/**
 * El aviso de una falla como *envelope* de Sentry (contracts/servicios.md §2): solo la pantalla, el
 * paso, la hora, qué falló y dónde. Nada de la persona, de su pedido ni de su conexión (FR-033).
 */
export function failureEnvelope({
  screen,
  step,
  error,
  environment,
  now,
  dsn,
}: Failure & { environment: string; now: Date; dsn: string }) {
  const { username: publicKey, protocol, host, pathname } = new URL(dsn)
  const eventId = crypto.randomUUID().replaceAll('-', '')
  const exception = failureException(step, error)
  const event = {
    event_id: eventId,
    timestamp: now.toISOString(),
    platform: 'node',
    level: 'error',
    environment,
    message: `${screen} · ${step}`,
    tags: { pantalla: screen, paso: step },
    fingerprint: [screen, step, exception.type],
    exception: { values: [exception] },
  }
  const lines = [{ event_id: eventId, sent_at: now.toISOString(), dsn }, { type: 'event' }, event]
  return {
    url: `${protocol}//${host}/api${pathname}/envelope/`,
    headers: {
      'content-type': 'application/x-sentry-envelope',
      'x-sentry-auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=adopciones/1`,
    },
    body: lines.map((line) => JSON.stringify(line)).join('\n'),
  }
}
