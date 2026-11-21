'use client'

import { tapFailedTexts, useAfterOpenOrTap } from '@/hooks/use-after-open-or-tap'
import { Button } from './button'
import { RetryNotice } from './retry-notice'

type TapButtonProps = Omit<React.ComponentProps<typeof Button>, 'onClick' | 'loading'> & {
  /** Lo que el toque necesita antes de abrir, como una hoja que baja aparte. */
  load: () => Promise<unknown>
  onArrive: () => void
}

/** Un botón que abre algo que todavía puede no haber llegado: trabaja mientras baja y, si no llega, avisa debajo. */
export function TapButton({ load, onArrive, ...button }: TapButtonProps) {
  // Sin bajarlo antes: lo que abre se dibuja pocas veces.
  const tap = useAfterOpenOrTap(load, false, false)
  const press = () => tap.wait(onArrive)
  return (
    <>
      <Button {...button} loading={tap.isWaiting} onClick={press} />
      {tap.hasFailed ? <RetryNotice texts={tapFailedTexts()} onRetry={press} /> : null}
    </>
  )
}
