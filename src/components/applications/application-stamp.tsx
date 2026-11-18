import { Stamp } from '@/components/ui/stamp'
import type { ApplicationTone } from '@/lib/applications/application-view'

type Props = {
  tone: ApplicationTone
  /** Ya traducido: «Esperando respuesta», «Te preguntaron algo», «Aceptada», «No aceptada», «Cerrada»… */
  label: string
  size?: 'md' | 'lg'
  /** Cae: quien la ve acaba de ponerle ese estado (historia #310). */
  falls?: boolean
}

// El sello del estado de una solicitud, en las dos puntas (docs/10, `ApplicationStatus`): tinta
// mientras espera, mate cocido cuando le toca actuar a alguien, yerba aceptada y gris cuando ya no
// cuenta.
export function ApplicationStamp({ tone, label, size, falls }: Props) {
  return (
    <Stamp tone={tone} size={size} falls={falls}>
      {label}
    </Stamp>
  )
}
