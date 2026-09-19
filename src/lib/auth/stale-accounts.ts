export const UNCONFIRMED_ACCOUNT_TTL_DAYS = 7

export type Candidate = {
  createdAt: Date
  confirmedAt: Date | null
}

// `generateLink` crea la persona aunque nadie abra el correo: escribir una dirección cualquiera
// dejaría un registro permanente. Esta limpieza corre con permisos de servicio en el camino
// anónimo de pedir un enlace, así que un error acá borra cuentas de gente real. Por eso el
// predicado vive solo, en una función pura con test: solo se borra quien **nunca confirmó** y ya
// pasó el plazo de FR-030a.
export function isPurgeable(candidate: Candidate, now: Date): boolean {
  if (candidate.confirmedAt !== null) return false

  const ageMs = now.getTime() - candidate.createdAt.getTime()
  return ageMs >= UNCONFIRMED_ACCOUNT_TTL_DAYS * 24 * 60 * 60 * 1000
}
