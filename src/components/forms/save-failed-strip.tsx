import { paperStrip } from '@/components/ui/paper-strip'
import { cn } from '@/lib/cn'

type Props = {
  /** Ya traducido: qué pasó, que lo cargado sigue ahí y qué tirita tocar. */
  message: string
  /** Cambia con cada fallo: la tira se vuelve a montar, entra de nuevo y se anuncia otra vez. */
  attempt: number
}

// Un guardado que no llegó, pegado arriba de la tirita: la tira de papel del `Toast` de error, quieta
// y sin sombra (docs/10 §Componentes, `SaveFailedStrip`). Sin botón propio: guardar y reintentar son
// el mismo toque (docs/10 §Principios 6). El remontaje por intento hace que un reintento sin conexión,
// que no llega a mostrar la tirita ocupada, igual conteste el toque (§Principios 4).
export function SaveFailedStrip({ message, attempt }: Props) {
  return (
    <div
      key={attempt}
      className={cn(
        paperStrip({ band: 'error' }),
        'animate-[fade-in_var(--dur-base)_var(--ease-out)]',
      )}
    >
      <p role="alert">{message}</p>
    </div>
  )
}
