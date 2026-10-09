/** Las cláusulas del compromiso, en el orden en que se leen (FR-010). */
export const COMMITMENT_CLAUSES = [
  'care',
  'neuter',
  'keep',
  'give_back',
  'take_back',
  'word',
] as const
export type CommitmentClause = (typeof COMMITMENT_CLAUSES)[number]

// El mismo texto para todas las adopciones; la castración solo si el animal no estaba castrado al
// marcarlo, que es lo que quedó guardado (FR-011).
export function commitmentClauses(input: { includesNeuter: boolean }): CommitmentClause[] {
  return COMMITMENT_CLAUSES.filter((clause) => clause !== 'neuter' || input.includesNeuter)
}
