'use client'

import { useRouter } from 'next/navigation'
import { declineAdoption } from '@/actions/adoptions'
import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'
import { declinedPath } from '@/lib/adoptions/paths'
import { myApplicationPath } from '@/lib/applications/paths'
import { signInWithNext } from '@/lib/auth/next-destination'

export type DeclineAdoptionTexts = DestructiveConfirmTexts & {
  /** Por clave de `adoptions.decline.errors`. */
  errors: Record<string, string>
}

type Props = {
  applicationId: string
  texts: DeclineAdoptionTexts
}

const FAILED = 'adoptions.decline.errors.failed'
const SESSION = 'adoptions.decline.errors.session'

// «Yo no adopté a Tobi» (plan §Mi solicitud): no se deshace, así que pide confirmar diciendo que
// quien lo dio se va a enterar (US3-AS1). Si la adopción cambió mientras tanto —ya la aceptó, terminó
// o se cortó el contacto—, lo dice dentro del diálogo y la pantalla de atrás se refresca.
export function DeclineAdoptionDialog({ applicationId, texts }: Props) {
  const router = useRouter()

  async function decline(): Promise<string | null> {
    const result = await declineAdoption({ applicationId }).catch(() => null)
    if (result?.ok) {
      router.replace(declinedPath(applicationId))
      return null
    }
    const key = result?.error ?? FAILED
    if (key === SESSION) {
      router.push(signInWithNext(myApplicationPath(applicationId)))
      return null
    }
    if (key !== FAILED) router.refresh()
    return texts.errors[key] ?? texts.errors[FAILED] ?? null
  }

  return <DestructiveConfirmDialog texts={texts} onConfirm={decline} />
}
