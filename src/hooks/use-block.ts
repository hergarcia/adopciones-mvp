'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { blockPerson, unblockPerson } from '@/actions/moderation'
import type { ActionResult } from '@/actions/result'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { BLOCKED_FLAG, withFlag, type BlockedNotice } from '@/lib/moderation/paths'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf } from './use-pet-status'

export type BlockFailure = 'offline' | 'no_response'

/** Lo que la pantalla dice cuando no salió: sin conexión, sin respuesta, o una clave de i18n. */
export type BlockError = { kind: BlockFailure } | { kind: 'refused'; key: string }

const SESSION = 'moderation.errors.session'

// Bloquear y desbloquear terminan igual: bien, la pantalla vuelve con su aviso; con la sesión
// vencida, a ingresar y de vuelta acá; sin conexión y sin respuesta son dos mensajes distintos y nada
// cambia, y reintentar es tocar de nuevo el mismo botón.
export function useBlock(options: { publicId: string; returnPath: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function settle<T>(
    pending: () => Promise<ActionResult<T>>,
    noticeFor: (data: T) => BlockedNotice,
  ): Promise<BlockError | { kind: 'ok'; notice: BlockedNotice } | null> {
    if (busy) return null
    setBusy(true)
    const attempt = navigator.onLine
      ? await raceDeadline(pending(), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    setBusy(false)

    if (attempt.kind !== 'result') return { kind: failureOf(attempt.kind) }
    const { result } = attempt
    if (result.ok) return { kind: 'ok', notice: noticeFor(result.data) }
    if (result.error === SESSION) {
      router.push(signInWithNext(options.returnPath))
      return null
    }
    return { kind: 'refused', key: result.error }
  }

  return {
    busy,
    block: () =>
      settle(
        () => blockPerson(options.publicId),
        () => 'hecho',
      ),
    unblock: () =>
      settle(
        () => unblockPerson(options.publicId),
        (data) => (data.already ? 'ya' : 'deshecho'),
      ),
    /** La pantalla a la que se vuelve, con el aviso de lo que pasó. */
    land: (notice: BlockedNotice) =>
      router.replace(withFlag(options.returnPath, BLOCKED_FLAG, notice)),
  }
}
