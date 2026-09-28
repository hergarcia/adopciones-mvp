'use client'

import { useRouter } from 'next/navigation'
import { giveVouch, removeVouch, withdrawVouch } from '@/actions/vouches'
import type { ActionResult } from '@/actions/result'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { withVouchFlag, type VouchFlag } from '@/lib/vouches/paths'
import { VOUCH_DEADLINE_MS, classifyVouchOutcome } from '@/lib/vouches/vouch-failure'

/** Lo que el `Sheet` o el `Dialog` dicen adentro: el aval no llegó, y por qué. */
export type VouchFailure = 'offline' | 'no_response'

// Avalar, retirar y quitar terminan igual (research R16): bien, la pantalla se vuelve a dibujar con
// la marca del aviso; con un motivo de FR-013, con el lugar de avalar de hoy; si la persona ya no
// existe, «este perfil no existe»; con la sesión vencida, a ingresar y de vuelta acá (FR-016). Lo
// que no llegó se dice adentro, y reintentar es tocar de nuevo el mismo botón.
export function useVouchFlow(returnPath: string) {
  const router = useRouter()

  async function settle<T>(
    pending: () => Promise<ActionResult<T>>,
    flagFor: (data: T) => VouchFlag,
    close: () => void,
  ): Promise<VouchFailure | null> {
    const outcome = navigator.onLine
      ? await raceDeadline(pending(), VOUCH_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    const verdict = classifyVouchOutcome({ online: navigator.onLine, outcome })
    if (verdict.kind === 'offline' || verdict.kind === 'no_response') return verdict.kind

    close()
    if (verdict.kind === 'ok')
      router.replace(withVouchFlag(returnPath, flagFor(verdict.data), Date.now()))
    else if (verdict.kind === 'reason')
      router.replace(withVouchFlag(returnPath, 'cambio', Date.now()))
    else if (verdict.kind === 'gone') router.refresh()
    else router.push(signInWithNext(returnPath))
    return null
  }

  return {
    give: (publicId: string, close: () => void) =>
      settle(
        () => giveVouch(publicId),
        () => 'dado',
        close,
      ),
    withdraw: (publicId: string, close: () => void) =>
      settle(
        () => withdrawVouch(publicId),
        (data) => (data.outcome === 'withdrawn' ? 'retirado' : 'ausente'),
        close,
      ),
    remove: (publicId: string, close: () => void) =>
      settle(
        () => removeVouch(publicId),
        (data) => (data.outcome === 'removed' ? 'quitado' : 'ausente'),
        close,
      ),
  }
}
