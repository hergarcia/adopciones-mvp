import { z } from 'zod'
import { PET_DRAFT_FIELDS, readFormDraft, text, type FormDraft } from '@/lib/pets/draft'
import type { LitterFormValues } from './types'

// Lo de un animal sin el sexo, más la fecha y las crías: lo escrito vuelve con sus crías (FR-017).
const FIELDS = PET_DRAFT_FIELDS.omit({ sex: true }).extend({
  deliversFrom: text,
  young: z.array(z.object({ key: text, name: text, sex: text, description: text })),
}) satisfies z.ZodType<LitterFormValues>

export function readLitterDraft(
  raw: string,
  accountId: string,
  now: number,
): FormDraft<LitterFormValues> | null {
  return readFormDraft(FIELDS, raw, accountId, now)
}
