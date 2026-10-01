import { timingSafeEqual } from 'node:crypto'
import { optionalEnv } from '@/lib/env'

// Las rutas que llama la base con `pg_net` (las tareas de identidad y de publicaciones) traen el
// secreto de Vault en `x-cron-secret`. Comparado en tiempo constante; sin secreto configurado, nadie.
export function isCronRequest(request: Request): boolean {
  const secret = optionalEnv('CRON_SECRET')
  const given = request.headers.get('x-cron-secret')
  if (secret === undefined || given === null) return false
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
