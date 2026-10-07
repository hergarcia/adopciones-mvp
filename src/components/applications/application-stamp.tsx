import { Stamp } from '@/components/ui/stamp'
import type { ApplicationTone } from '@/lib/applications/application-view'

type Props = {
  tone: ApplicationTone
  /** Ya traducido: «Enviada», «No disponible por ahora», «Retirada», «Cerrada». */
  label: string
  size?: 'md' | 'lg'
}

// El sello del estado de una solicitud: tinta mientras espera, mate cocido si el animal no está a la
// vista por ahora, gris cuando ya no cuenta.
export function ApplicationStamp({ tone, label, size }: Props) {
  return (
    <Stamp tone={tone} size={size}>
      {label}
    </Stamp>
  )
}
