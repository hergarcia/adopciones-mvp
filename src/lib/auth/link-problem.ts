import { carriedDestination } from './next-destination'

export type LinkProblem = 'superseded' | 'consumed' | 'expired' | 'unknown' | 'otra-cuenta'

export type LinkProblemTexts = {
  superseded: string
  consumed: string
  expired: string
  unknown: string
  otherAccount: string
}

// Cuatro motivos, cuatro mensajes: decirle «enlace inválido» a alguien que tiene uno más nuevo en
// el buzón lo deja sin saber qué hacer (FR-005). El único que no ofrece reenviar es el de la otra
// cuenta, porque ahí lo que corresponde es cerrar sesión, no pedir otro enlace.
// Recibe lo que venga en la URL, que es texto sin garantías: lo que no reconoce cae en el
// mensaje general, nunca en una pantalla muda.
export function linkProblemMessage(problem: string, texts: LinkProblemTexts): string {
  switch (problem) {
    case 'superseded':
      return texts.superseded
    case 'consumed':
      return texts.consumed
    case 'expired':
      return texts.expired
    case 'otra-cuenta':
      return texts.otherAccount
    default:
      return texts.unknown
  }
}

export function canResend(problem: string): boolean {
  return problem !== 'otra-cuenta'
}

// El id del enlace viaja para que «Enviarme otro» funcione en un toque: el servidor resuelve la
// dirección a partir de él y la pantalla nunca la conoce (FR-005b). El destino viaja para que el
// enlace nuevo lleve a donde iba el que no sirvió, y pasa por el filtro antes de salir: esta URL
// la arma el servidor a partir de lo que vino en un enlace.
export function linkProblemPath(
  motivo: string,
  linkId: string | null,
  next: string | null,
): string {
  const params = new URLSearchParams({ motivo })
  if (linkId !== null) params.set('link', linkId)
  const destination = carriedDestination(next)
  if (destination !== null) params.set('next', destination)
  return `/entrar/enlace?${params}`
}
