import { timingSafeEqual } from 'node:crypto'
import { optionalEnv } from '@/lib/env'

const BEARER = 'Bearer '

// La base llama con el secreto de Vault en `x-cron-secret`; Vercel Cron, con `CRON_SECRET` como
// `Authorization: Bearer` (research R7). Es el mismo secreto.
function givenSecret(request: Request): string | null {
  const header = request.headers.get('x-cron-secret')
  if (header !== null) return header
  const authorization = request.headers.get('authorization')
  return authorization?.startsWith(BEARER) ? authorization.slice(BEARER.length) : null
}

// Comparado en tiempo constante; sin secreto configurado, nadie.
export function isCronRequest(request: Request): boolean {
  const secret = optionalEnv('CRON_SECRET')
  const given = givenSecret(request)
  if (secret === undefined || given === null) return false
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
