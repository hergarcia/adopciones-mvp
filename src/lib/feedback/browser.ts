import { createHash, randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { FEEDBACK_BROWSER_COOKIE } from './browser-cookie'

// El navegador que manda opiniones, para el tope del día (FR-023, research R8): a la base llega solo
// el SHA-256 del valor al azar de la cookie, que no dice nada de la persona ni se guarda con la
// opinión. Un navegador que no guarda cookies no tiene tope: es un freno, no una garantía.
export async function feedbackBrowserHash(): Promise<string> {
  const browser = (await cookies()).get(FEEDBACK_BROWSER_COOKIE)?.value || randomUUID()
  return createHash('sha256').update(browser).digest('hex')
}
