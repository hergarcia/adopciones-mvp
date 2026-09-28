// La regla de vías de contacto de los datos de un animal (FR-014). Parte de la del perfil
// (`contactKind` en lib/schemas/profile.ts, que no cambia) y es más estricta: en la descripción
// hay que frenar los fijos de 8 dígitos, el celular sin el 0, los acortadores y los usuarios de
// redes. Devuelve el fragmento que la disparó, porque el error lo cita para que se encuentre en un
// texto largo.
export type ContactKind = 'phone' | 'email' | 'web' | 'social'
export type ContactMatch = { kind: ContactKind; fragment: string }

const EMAIL = /\p{L}@\p{L}/u
const SOCIAL = /(?<![\p{L}\p{N}_@])@[\p{L}\p{N}_]/u
const WEB = /(?:https?:\/\/|www\.)|\.(?:com|uy|net|org)(?![\p{L}\p{N}])/iu
const SHORTENER =
  /(?<![\p{L}\p{N}])(?:wa\.me|t\.me|bit\.ly|tinyurl\.com|linktr\.ee)(?![\p{L}\p{N}])/iu
// Ocho dígitos o más, contando como seguidos los que separa un espacio, un punto o un guion, solos
// o con espacios alrededor. La coma no une: «2023, 2024» son dos años.
const PHONE = /\+?\d(?:(?:\s*[.-]\s*|\s+)?\d){7,}/u
// Día, mes y año de cuatro cifras: tiene ocho dígitos y no es un teléfono.
const DATE =
  /(?<!\d)(?:0?[1-9]|[12]\d|3[01])(?:\s*[./-]\s*|\s+)(?:0?[1-9]|1[0-2])(?:\s*[./-]\s*|\s+)(?:19|20)\d{2}(?!\d)/gu
const EDGE_PUNCTUATION = /^[(«"'¿¡]+|[.,;:!?)»"']+$/gu

type Found = { kind: ContactKind; index: number; fragment: string }

// La palabra entera que contiene lo encontrado: «instagram.com/luna» y no «.com».
function findWord(text: string, pattern: RegExp, kind: ContactKind): Found | null {
  const match = pattern.exec(text)
  if (match === null) return null
  const index = text.slice(0, match.index).search(/\S*$/u)
  const end = text.slice(match.index).search(/\s|$/u) + match.index
  return { kind, index, fragment: text.slice(index, end).replace(EDGE_PUNCTUATION, '') }
}

function findPhone(text: string): Found | null {
  // Las fechas se tapan con letras del mismo largo, así los índices siguen valiendo en el original.
  const masked = text.replaceAll(DATE, (date) => 'x'.repeat(date.length))
  const match = PHONE.exec(masked)
  if (match === null) return null
  const fragment = text.slice(match.index, match.index + match[0].length)
  return { kind: 'phone', index: match.index, fragment }
}

// Si hay varias, la que aparece primero en el texto: es la que la persona va a encontrar leyendo.
export function petContactMatch(text: string): ContactMatch | null {
  const found = [
    findWord(text, EMAIL, 'email'),
    findWord(text, SHORTENER, 'web'),
    findWord(text, WEB, 'web'),
    findWord(text, SOCIAL, 'social'),
    findPhone(text),
  ].filter((candidate) => candidate !== null)
  if (found.length === 0) return null

  const first = found.reduce((best, candidate) => (candidate.index < best.index ? candidate : best))
  return { kind: first.kind, fragment: first.fragment }
}

// Tres dígitos seguidos son el número de puerta de una dirección; la zona es el barrio o la
// localidad (FR-011). «Villa 25 de Agosto» y «Km 16» pasan.
export function hasStreetNumber(text: string): boolean {
  return /\d{3}/u.test(text)
}
