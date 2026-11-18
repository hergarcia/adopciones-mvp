import { getTranslations } from 'next-intl/server'
import type { LaterPart } from '@/components/ui/deferred-part'
import { RetryNotice } from '@/components/ui/retry-notice'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmSkeleton, type ConfirmShape } from './confirm-skeleton'

// La espera y el aviso los dibuja el servidor: viajan en el HTML, así no suman código al abrir y se
// ven aunque la señal se haya cortado (historia #316). El aviso es uno solo para todas las hojas.
async function laterPart(waiting: React.ReactNode, frame?: string): Promise<LaterPart> {
  const t = await getTranslations('common.part_failed')
  const failed = <RetryNotice texts={{ message: t('message'), retry: t('retry') }} />
  return frame === undefined
    ? { waiting, failed }
    : {
        waiting: <div className={frame}>{waiting}</div>,
        failed: <div className={frame}>{failed}</div>,
      }
}

/** En un `Dialog`, la espera y el aviso van debajo de lo que va a pasar (`laterDialog`). */
export const DIALOG_PART = 'mt-6 w-full'

/**
 * Lo de adentro de una hoja o de una pregunta: la forma de lo que se elige y de los botones, en el
 * lugar que dice `frame`.
 */
export function laterConfirm(shape: ConfirmShape = {}, frame?: string): Promise<LaterPart> {
  return laterPart(<ConfirmSkeleton {...shape} />, frame)
}

/** Un botón que llega después de abrir, como «Avalar» o «Retirar»: su espera ocupa su tamaño. */
export function laterButton(size: string): Promise<LaterPart> {
  return laterPart(<Skeleton className={size} />)
}
