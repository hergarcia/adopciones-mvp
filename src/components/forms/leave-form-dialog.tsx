'use client'

import { useEffect, useEffectEvent } from 'react'
import { RetryNotice } from '@/components/ui/retry-notice'
import { tapFailedTexts, useAfterOpenOrTap } from '@/hooks/use-after-open-or-tap'
import type { LeaveAsked } from '@/hooks/use-unsaved-changes'
import type { LeavingTexts } from './leaving-dialog'

// Con la capa de `Dialog`: si bajaba aparte, el aviso llegaba y el toque seguía sin contestar.
const loadDialog = () =>
  Promise.all([import('./leaving-dialog'), import('@/components/ui/overlay-layer')]).then(
    ([module]) => module.LeavingDialog,
  )

type Props = {
  /** Baja con el primer cambio y no antes: sin cambios no hay nada que avisar. */
  dirty: boolean
  asked: LeaveAsked | null
  texts: LeavingTexts
  onStay: () => void
  onLeave: () => void
}

// «Tenés cambios sin guardar» de un formulario que abre por partes (historia #338). El toque al menú
// que llega antes que el aviso deja el enlace trabajando mientras baja y, si no llega en 10 s, el
// aviso de #318 con «Reintentar»; llegado tarde, no se abre solo.
export function LeaveFormDialog({ dirty, asked, texts, onStay, onLeave }: Props) {
  const dialog = useAfterOpenOrTap(loadDialog, dirty, false)
  const ask = useEffectEvent(() => {
    if (dialog.value === null || dialog.hasFailed) dialog.wait(() => {})
  })

  useEffect(() => {
    if (asked !== null) ask()
  }, [asked])

  // El enlace es del layout, de servidor: el trabajando se le marca acá y lo pinta globals.css.
  const from = asked?.from ?? null
  useEffect(() => {
    if (!dialog.isWaiting || from === null) return undefined
    from.setAttribute('aria-busy', 'true')
    return () => from.removeAttribute('aria-busy')
  }, [dialog.isWaiting, from])

  if (dialog.hasFailed) {
    return <RetryNotice texts={tapFailedTexts()} onRetry={() => dialog.wait(() => {})} />
  }
  if (dialog.value === null) return null
  const Dialog = dialog.value
  return <Dialog open={asked !== null} texts={texts} onStay={onStay} onLeave={onLeave} />
}
