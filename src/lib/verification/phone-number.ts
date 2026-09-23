export type PhoneNumberProblem = 'empty' | 'format' | 'landline' | 'foreign'

export type ParsedPhoneNumber =
  { ok: true; e164: string } | { ok: false; problem: PhoneNumberProblem }

const URUGUAY = '598'
const SEPARATORS = /[\s.()-]/g
// Ocho dígitos después del cero: 9 y de 1 a 9, que son las compañías de celular (091 a 099).
const MOBILE = /^9[1-9]\d{6}$/
// Los fijos tienen ocho dígitos y empiezan con 2 (Montevideo) o con 4 (el interior).
const LANDLINE = /^[24]\d{7}$/

// Toda forma en que una persona escribe su celular uruguayo termina en el mismo E.164 (FR-001):
// con o sin el cero, con 598, +598 o 00598, también con el código de país y el cero a la vez.
export function parsePhoneNumber(input: string): ParsedPhoneNumber {
  const compact = input.replaceAll(SEPARATORS, '')
  if (compact === '') return { ok: false, problem: 'empty' }
  if (!/^\+?\d+$/.test(compact)) return { ok: false, problem: 'format' }

  const international = compact.startsWith('+') || compact.startsWith('00')
  // Stryker disable next-line Regex: equivalente — el chequeo de arriba ya deja el + solo al principio
  const digits = compact.replace(/^\+|^00/, '')

  let national: string
  if (international) {
    if (!digits.startsWith(URUGUAY)) {
      return { ok: false, problem: digits.length >= 8 ? 'foreign' : 'format' }
    }
    national = digits.slice(URUGUAY.length)
  } else if (digits.startsWith(URUGUAY)) {
    // Ningún número nacional empieza con 598 —los celulares empiezan con 09 o 9, los fijos con 2 o
    // 4—, así que si empieza así, es el código de país escrito sin el +.
    national = digits.slice(URUGUAY.length)
  } else {
    national = digits
  }

  national = national.replace(/^0/, '')
  if (MOBILE.test(national)) return { ok: true, e164: `+${URUGUAY}${national}` }
  if (LANDLINE.test(national)) return { ok: false, problem: 'landline' }
  return { ok: false, problem: 'format' }
}

// Siempre igual, con el cero y de a tres (FR-003): `+59899123456` → `099 123 456`.
export function formatPhoneNumber(e164: string): string {
  const national = `0${e164.slice(URUGUAY.length + 1)}`
  return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}
