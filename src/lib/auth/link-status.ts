export type LinkRecord = {
  expiresAt: Date
  consumedAt: Date | null
  supersededAt: Date | null
}

export type LinkStatus = 'usable' | 'superseded' | 'consumed' | 'expired' | 'unknown'

// El orden no es arbitrario: gana el motivo más útil para quien está mirando la pantalla.
// «Reemplazado» primero, porque hay un enlace nuevo esperando en su buzón y eso es lo que tiene
// que hacer; después «ya usado», porque puede que ya esté adentro; y «vencido» al final, que es
// el que solo deja pedir otro (FR-005a).
export function linkStatus(link: LinkRecord | null, now: Date): LinkStatus {
  if (link === null) return 'unknown'
  if (link.supersededAt !== null) return 'superseded'
  if (link.consumedAt !== null) return 'consumed'
  if (link.expiresAt.getTime() <= now.getTime()) return 'expired'
  return 'usable'
}
