import { getTranslations } from 'next-intl/server'
import type { Sex } from '@/lib/pets/options'
import { commitmentClauses } from './commitment'

export type CommitmentNames = { pet: string; sex: Sex; adopter: string; publisher: string }

/** Las cláusulas del compromiso con los tres nombres, y la nota de «acuerdo de palabra». */
export async function commitmentTexts(
  names: CommitmentNames,
  includesNeuter: boolean,
  locale: string,
): Promise<{ clauses: string[]; note: string }> {
  const t = await getTranslations({ locale, namespace: 'adoptions.commitment.clauses' })
  const values = { ...names }
  const clauses = commitmentClauses({ includesNeuter }).map((clause) => t(clause, values))
  return { clauses: clauses.slice(0, -1), note: clauses.at(-1) ?? '' }
}
