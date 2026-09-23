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

export function linkFor(email: string): string {
  const mine = messagesTo(MAIL_DIR, email).at(-1)
  expect(mine, `el producto tiene que haber escrito el correo a ${email}`).toBeDefined()

  const url = /https?:\/\/\S+\/auth\/confirm\S*/.exec(field(mine, 'text'))?.[0]
  expect(url, 'el correo tiene que traer el enlace').toBeDefined()
  return url ?? ''
}

export function codeFor(e164: string): string {
  const mine = messagesTo(SMS_DIR, e164).at(-1)
  expect(mine, `el producto tiene que haber escrito el mensaje a ${e164}`).toBeDefined()

  const code = /\b(\d{6})\b/.exec(field(mine, 'body'))?.[1]
  expect(code, 'el mensaje tiene que traer el código').toBeDefined()
  return code ?? ''
}
