import { isFaultKey } from '@/lib/errors/is-fault'
import { reportFailure } from '@/lib/errors/report'
import { requestScreen } from '@/lib/errors/request-screen'

// Las Server Actions no lanzan: devuelven esto (docs/08 §Dónde vive la lógica que se repite). El
// `error` es una clave de i18n, nunca un texto, así que la redacción vive en un solo lugar.
// `seconds` acompaña a los errores que traen una espera, para que el mensaje pueda decir cuánto
// falta en vez de un «esperá» pelado (US1-AS7). `detail` lleva lo que el mensaje de una acción
// necesita además de la clave —los intentos que quedan, a qué número—, tipado por cada acción en
// vez de sumar campos opcionales al tipo que comparten todas.
export type ActionResult<T, D = never> =
  { ok: true; data: T } | { ok: false; error: string; seconds?: number; detail?: D }

/**
 * El resultado de una acción que no anduvo por el sitio o por un servicio. Como las acciones no
 * lanzan, `onRequestError` no las ve: esto avisa al registro con la pantalla desde la que se pidió y
 * `step`, el paso en inglés (research R10 vía 2). Un rechazo por una regla no se avisa (FR-032).
 */
export async function failed(
  key: string,
  step: string,
  cause?: unknown,
): Promise<{ ok: false; error: string }> {
  if (isFaultKey(key)) reportFailure({ screen: await requestScreen(), step, error: cause })
  return { ok: false, error: key }
}
