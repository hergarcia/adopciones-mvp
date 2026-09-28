'use client'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

type Action = {
  label: string
  onClick: () => void
  /** Solo la primaria: la acción que está en curso. */
  loading?: boolean
  /** Solo la secundaria: mientras la primaria trabaja. */
  disabled?: boolean
}

type Props = {
  open: boolean
  title: string
  closeLabel: string
  /** Cerrar sin elegir: la cruz, Escape o tocar afuera. */
  onDismiss: () => void
  primary: Action
  secondary: Action
  /** Lo que se explica antes de elegir. */
  children: React.ReactNode
}

// Un aviso con dos salidas y la que conviene primero (docs/10: acciones a la izquierda, bajo el
// texto). Salir con lo cargado, el nombre repetido y el guardado bloqueado tienen esta forma.
export function ChoiceDialog({
  open,
  title,
  closeLabel,
  onDismiss,
  primary,
  secondary,
  children,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss()
      }}
      title={title}
      closeLabel={closeLabel}
    >
      <div className="text-base text-ink">{children}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" loading={primary.loading} onClick={primary.onClick}>
          {primary.label}
        </Button>
        <Button variant="secondary" disabled={secondary.disabled} onClick={secondary.onClick}>
          {secondary.label}
        </Button>
      </div>
    </Dialog>
  )
}
