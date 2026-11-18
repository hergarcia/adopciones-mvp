import { APPLICATION_DRAFT_PREFIX } from '@/lib/drafts/account-drafts'

/** Uno por animal: empezar el de Luna no borra el de Tobi (spec §Edge Cases). */
export function applicationDraftKey(code: string): string {
  return `${APPLICATION_DRAFT_PREFIX}${code}`
}
