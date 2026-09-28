import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect } from '@playwright/test'

// Lo que el producto deja en disco contra la base local, en vez de mandarlo: los correos del enlace
// (historia #9) y los mensajes del código (historia #10). Se busca por destinatario y no «el
// último»: las pruebas comparten el buzón, y quedarse con el más nuevo haría que una se lleve el
// mensaje de la otra.
const MAIL_DIR = '.artifacts/mail'
const SMS_DIR = '.artifacts/sms'

// El buzón es un archivo que escribe el propio producto, pero para el compilador es JSON: se lee
// campo por campo en vez de afirmar la forma de un golpe.
function field(record: unknown, key: string): string {
  if (typeof record !== 'object' || record === null) return ''
  const value: unknown = Reflect.get(record, key)
  return typeof value === 'string' ? value : ''
}

function messagesTo(dir: string, recipient: string): unknown[] {
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    names = []
  }
  return names
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name): unknown => JSON.parse(readFileSync(join(dir, name), 'utf8')))
    .filter((message) => field(message, 'to') === recipient)
}

const LOGIN_LINK = /https?:\/\/\S+\/auth\/confirm\S*/

// El último enlace de ingreso, no el último correo: a la misma dirección le pueden llegar otros
// avisos (historia #25).
export function linkFor(email: string): string {
  const mine = messagesTo(MAIL_DIR, email)
    .filter((message) => LOGIN_LINK.test(field(message, 'text')))
    .at(-1)
  expect(mine, `el producto tiene que haber escrito el enlace a ${email}`).toBeDefined()
  return LOGIN_LINK.exec(field(mine, 'text'))?.[0] ?? ''
}

// El correo se escribe cuando el envío termina, que puede ser un instante después de que la pantalla
// de espera ya cargó: con varias pruebas a la vez, leerlo en el acto a veces no lo encuentra.
export async function waitForLinkFor(email: string): Promise<string> {
  await expect
    .poll(
      () => messagesTo(MAIL_DIR, email).some((message) => LOGIN_LINK.test(field(message, 'text'))),
      { message: `el producto tiene que haber escrito el enlace a ${email}` },
    )
    .toBe(true)
  return linkFor(email)
}

export type Mail = { subject: string; html: string; text: string }

function lastWithSubject(email: string, subject: string): unknown {
  return messagesTo(MAIL_DIR, email)
    .filter((message) => field(message, 'subject') === subject)
    .at(-1)
}

/** Para esperar un correo que sale después de responder. */
export function hasMail(email: string, subject: string): boolean {
  return lastWithSubject(email, subject) !== undefined
}

/** El último correo a esa dirección con ese asunto. */
export function mailTo(email: string, subject: string): Mail {
  const mine = lastWithSubject(email, subject)
  expect(mine, `el producto tiene que haber escrito «${subject}» a ${email}`).toBeDefined()
  return { subject, html: field(mine, 'html'), text: field(mine, 'text') }
}

export function codeFor(e164: string): string {
  const mine = messagesTo(SMS_DIR, e164).at(-1)
  expect(mine, `el producto tiene que haber escrito el mensaje a ${e164}`).toBeDefined()

  const code = /\b(\d{6})\b/.exec(field(mine, 'body'))?.[1]
  expect(code, 'el mensaje tiene que traer el código').toBeDefined()
  return code ?? ''
}
