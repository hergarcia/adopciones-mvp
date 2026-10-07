// Los motivos de rechazo de FR-020, en el orden en que se ofrecen; la base los repite con un test de
// paridad. Las claves en inglés (docs/06); el texto, en `inbox.reasons.*`.
export const REJECTION_REASONS = [
  'chose_other',
  'housing',
  'alone_too_long',
  'no_neuter_commitment',
  'household_fit',
  'no_answer',
  'other',
] as const
export type RejectionReason = (typeof REJECTION_REASONS)[number]

/** Dejar sin efecto suma «la adopción no se concretó», primero (FR-024). */
export const REVOCATION_REASONS = ['not_concluded', ...REJECTION_REASONS] as const
export type RevocationReason = (typeof REVOCATION_REASONS)[number]
