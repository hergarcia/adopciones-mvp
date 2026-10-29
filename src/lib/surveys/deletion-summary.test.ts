// Covers: US3-AS1, US3-AS3, US3-AS4, FR-018, FR-019 (las cuentas y las cinco opciones por clase)
import { describe, expect, it } from 'vitest'
import { DELETION_ANSWERS, DELETION_KINDS } from '@/lib/pets/deletion-reason'
import { deletionReasonSummary, type DeletionSummaryRow } from './deletion-summary'

const OPTIONS = [
  'no_applications',
  'unconvincing_applications',
  'given_elsewhere',
  'not_for_adoption',
  'other',
] as const

const none = { asked: 0, answered: 0, unanswered: 0 }

function zeroOptions() {
  return OPTIONS.map((option) => ({ option, total: 0, byKind: { pet: 0, litter: 0 } }))
}

/** Las doce combinaciones, como las devuelve la base, con los números de `totals`. */
function rowsWith(totals: Partial<Record<string, number>>): DeletionSummaryRow[] {
  return DELETION_KINDS.flatMap((kind) =>
    DELETION_ANSWERS.map((reason) => ({ kind, reason, total: totals[`${kind}.${reason}`] ?? 0 })),
  )
}

describe('deletionReasonSummary', () => {
  it.each([
    ['sin filas', []],
    ['con las doce combinaciones en cero', rowsWith({})],
  ])('%s: todo en cero y las cinco opciones igual', (_, rows) => {
    expect(deletionReasonSummary(rows)).toEqual({
      ...none,
      byKind: { pet: none, litter: none },
      options: zeroOptions(),
    })
  })

  it('solo sin contestar: preguntado, nadie contestó y las opciones en cero', () => {
    const summary = deletionReasonSummary(rowsWith({ 'pet.unanswered': 3, 'litter.unanswered': 2 }))
    expect(summary).toEqual({
      asked: 5,
      answered: 0,
      unanswered: 5,
      byKind: {
        pet: { asked: 3, answered: 0, unanswered: 3 },
        litter: { asked: 2, answered: 0, unanswered: 2 },
      },
      options: zeroOptions(),
    })
  })

  // Covers: SC-005 (qué opción se eligió más y si cambia entre animales y camadas)
  it('suma cada opción en total y por clase, y lo preguntado es contestado más sin contestar', () => {
    const summary = deletionReasonSummary(
      rowsWith({
        'pet.no_applications': 2,
        'pet.unconvincing_applications': 1,
        'pet.not_for_adoption': 1,
        'pet.unanswered': 3,
        'litter.no_applications': 1,
        'litter.given_elsewhere': 4,
        'litter.other': 2,
        'litter.unanswered': 1,
      }),
    )
    expect(summary).toEqual({
      asked: 15,
      answered: 11,
      unanswered: 4,
      byKind: {
        pet: { asked: 7, answered: 4, unanswered: 3 },
        litter: { asked: 8, answered: 7, unanswered: 1 },
      },
      options: [
        { option: 'no_applications', total: 3, byKind: { pet: 2, litter: 1 } },
        { option: 'unconvincing_applications', total: 1, byKind: { pet: 1, litter: 0 } },
        { option: 'given_elsewhere', total: 4, byKind: { pet: 0, litter: 4 } },
        { option: 'not_for_adoption', total: 1, byKind: { pet: 1, litter: 0 } },
        { option: 'other', total: 2, byKind: { pet: 0, litter: 2 } },
      ],
    })
  })

  it('las combinaciones que la base no devolvió cuentan cero, sin importar el orden de las filas', () => {
    const summary = deletionReasonSummary([
      { kind: 'litter', reason: 'other', total: 1 },
      { kind: 'pet', reason: 'other', total: 2 },
      { kind: 'litter', reason: 'unanswered', total: 5 },
    ])
    expect(summary.byKind).toEqual({
      pet: { asked: 2, answered: 2, unanswered: 0 },
      litter: { asked: 6, answered: 1, unanswered: 5 },
    })
    expect(summary.options.map((option) => option.option)).toEqual(OPTIONS)
    expect(summary.options.at(-1)).toEqual({
      option: 'other',
      total: 3,
      byKind: { pet: 2, litter: 1 },
    })
  })
})
