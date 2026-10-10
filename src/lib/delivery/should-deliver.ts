const DELIVERING: ReadonlySet<string | undefined> = new Set(['production', 'preview'])

// Solo el sitio corriendo en Vercel manda a PostHog o a Sentry, y solo con la clave del servicio: en
// local, en CI y en las pruebas no sale nada (spec §Edge Cases «Las pruebas no se mezclan»). La clave
// llega de `optionalEnv`, que ya toma vacía por ausente.
export function shouldDeliver(env: { VERCEL_ENV?: string | undefined; key?: string | undefined }) {
  return DELIVERING.has(env.VERCEL_ENV) && env.key !== undefined
}
