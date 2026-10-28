import { cookies } from 'next/headers'
import { optionalEnv } from '@/lib/env'
import type { ExitLevel } from './exit-question'

// El ticket de la pregunta viaja en una cookie y no en la dirección, que queda en el historial y en
// los registros del servidor (research R3). Una por nivel: la pregunta del teléfono no pisa la de la
// identidad. Las páginas solo preguntan si existe; el valor lo leen las acciones.
const COOKIE: Record<ExitLevel, string> = {
  phone: 'salida-telefono',
  identity: 'salida-identidad',
}

const ONE_DAY = 60 * 60 * 24

export async function setExitTicket(level: ExitLevel, ticket: string): Promise<void> {
  ;(await cookies()).set(COOKIE[level], ticket, {
    httpOnly: true,
    sameSite: 'lax',
    // En local y en las pruebas el sitio corre por http; en Vercel, siempre por https.
    secure: optionalEnv('VERCEL_ENV') !== undefined,
    path: '/',
    maxAge: ONE_DAY,
  })
}

export async function readExitTicket(level: ExitLevel): Promise<string | null> {
  return (await cookies()).get(COOKIE[level])?.value ?? null
}

export async function hasExitTicket(level: ExitLevel): Promise<boolean> {
  return (await cookies()).has(COOKIE[level])
}

export async function clearExitTicket(level: ExitLevel): Promise<void> {
  ;(await cookies()).delete(COOKIE[level])
}
