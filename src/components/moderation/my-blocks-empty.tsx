import { EmptyState } from '@/components/ui/empty-state'

type Props = {
  /** Ya traducido: «No bloqueaste a nadie» y qué hace un bloqueo. */
  text: string
  /** Volver a «Mi perfil». */
  action: React.ReactNode
}

// Sin bloqueos: qué es un bloqueo, para quien llega antes de necesitarlo (US3-AS7).
export function MyBlocksEmpty({ text, action }: Props) {
  return <EmptyState title={text} action={action} />
}
