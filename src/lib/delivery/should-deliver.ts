const DELIVERING: ReadonlySet<string | undefined> = new Set(['production', 'preview'])

// Solo el sitio de verdad (con `DEPLOY_ENV`) manda a PostHog o a Sentry, y solo con la clave del servicio: en
// local, en CI y en las pruebas no sale nada (spec §Edge Cases «Las pruebas no se mezclan»). La clave
// llega de `optionalEnv`, que ya toma vacía por ausente.
export function shouldDeliver(env: {
  DEPLOY_ENV?: string | undefined
  key?: string | undefined
}): env is { DEPLOY_ENV: string; key: string } {
  return DELIVERING.has(env.DEPLOY_ENV) && env.key !== undefined
}
