import type { PetAdoptionSummary } from './types'

export type HandoverLine =
  | { kind: 'outside' }
  | { kind: 'declined'; person: string }
  | {
      kind: 'person'
      person: string
      commitment: { kind: 'pending' } | { kind: 'accepted'; at: string }
    }

// El renglón de Mis animales debajo de un adoptado (FR-040). Sin adopción registrada —anterior a la
// historia #67— o con la persona que borró su cuenta, nada: el sello ya dice «Adoptado», sin a quién.
export function handoverLine(summary: PetAdoptionSummary | undefined): HandoverLine | null {
  if (summary === undefined) return null
  if (summary.kind === 'outside') return { kind: 'outside' }
  if (summary.adopterName === null) return null
  if (summary.declined) return { kind: 'declined', person: summary.adopterName }
  return {
    kind: 'person',
    person: summary.adopterName,
    commitment:
      summary.adopterAcceptedAt === null
        ? { kind: 'pending' }
        : { kind: 'accepted', at: summary.adopterAcceptedAt },
  }
}
