import { Stamp } from '@/components/ui/stamp'

type Props = {
  tone: 'ink' | 'muted'
  /** Ya traducido: «Enviada», «Retirada», «Cerrada». */
  label: string
  size?: 'md' | 'lg'
}

// El sello del estado de una solicitud: tinta mientras espera, gris cuando ya no cuenta.
export function ApplicationStamp({ tone, label, size }: Props) {
  return (
    <Stamp tone={tone} size={size}>
      {label}
    </Stamp>
  )
}
