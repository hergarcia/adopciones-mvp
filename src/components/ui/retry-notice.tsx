import { Button } from './button'
import { ErrorText } from './error-text'

export type RetryTexts = { message: string; retry: string }

type Props = {
  /** Ya traducidos. */
  texts: RetryTexts
  /** Sin `onRetry` lo dibuja el servidor (`LaterPart`) y el toque lo atiende `deferredPart`. */
  onRetry?: () => void
}

// Lo que no llegó después de abrir, en el lugar donde iba: el aviso anunciado y «Reintentar», que lo
// vuelve a pedir sin tocar el resto de la pantalla (historias #304, #316 y #318). `basis-full`: debajo
// de un botón en una fila, baja a su propio renglón.
export function RetryNotice({ texts, onRetry }: Props) {
  return (
    <div className="flex w-full max-w-[var(--measure)] basis-full flex-col items-start gap-3">
      <ErrorText announce>{texts.message}</ErrorText>
      <Button variant="secondary" onClick={onRetry}>
        {texts.retry}
      </Button>
    </div>
  )
}
