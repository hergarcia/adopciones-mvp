'use client'

import * as Primitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'
import type { LayerControl } from './overlay'
import { OverlayCloser } from './overlay-close'
import { closeButton } from './overlay-styles'

// La parte de Radix de `Dialog` y `Sheet`: el velo de tinta, la cruz de cerrar y el panel. Llega
// después de abrir (`OverlayShell`).

function Backdrop() {
  return (
    <Primitive.Overlay className="fixed inset-0 z-20 bg-ink/40 data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]" />
  )
}

function OverlayClose({ label, className }: { label: string; className?: string }) {
  return (
    <Primitive.Close aria-label={label} className={cn(closeButton, 'absolute', className)}>
      <CloseIcon />
    </Primitive.Close>
  )
}

type LayerProps = LayerControl & {
  title: string
  closeLabel: string
  children: React.ReactNode
  className?: string
}

function Layer({
  open,
  onOpenChange,
  children,
}: Omit<LayerControl, 'onCloseAutoFocus'> & { children: React.ReactNode }) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <OverlayCloser value={() => onOpenChange(false)}>
          <Backdrop />
          {children}
        </OverlayCloser>
      </Primitive.Portal>
    </Primitive.Root>
  )
}

// La cinta va en un div interno: `.cinta` fija `position: relative`, y el contenedor tiene que
// seguir siendo `fixed`. Lo que corre es el relleno de adentro: si corriera la nota, cortaría la
// cinta, que asoma por arriba del borde.
export function DialogLayer({
  title,
  description,
  closeLabel,
  children,
  className,
  ...control
}: LayerProps & { description?: string }) {
  return (
    <Layer {...control}>
      <Primitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        onCloseAutoFocus={control.onCloseAutoFocus}
        className={cn(
          'fixed top-1/2 left-1/2 z-20 w-[calc(100%-var(--spacing-gutter)*2)] max-w-[var(--measure)] -translate-x-1/2 -translate-y-1/2',
          'data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]',
          className,
        )}
      >
        <div className="cinta flex max-h-[calc(100dvh-var(--spacing-gutter)*2)] flex-col border-2 border-ink bg-canvas shadow-float">
          <div className="overflow-y-auto p-6">
            <Primitive.Title className="afiche pr-11 text-2xl text-ink">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="mt-2 text-base text-ink-muted">
                {description}
              </Primitive.Description>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">{children}</div>
          </div>
          <OverlayClose label={closeLabel} className="top-2 right-2" />
        </div>
      </Primitive.Content>
    </Layer>
  )
}

// De dónde entra lo decide el ancho de la pantalla, no quien la usa: desde abajo en el teléfono,
// desde el costado a partir de 768 (docs/10 §Componentes).
const panel = cn(
  'fixed z-20 overflow-y-auto border-ink bg-canvas p-6 shadow-float',
  'inset-x-0 bottom-0 max-h-[80dvh] border-t-2',
  'md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-full md:max-w-sheet md:border-t-0 md:border-l-2',
  'data-[state=open]:animate-[slide-up-in_var(--dur-base)_var(--ease-out)] data-[state=closed]:animate-[slide-down-out_var(--dur-base)_var(--ease-out)]',
  'md:data-[state=open]:animate-[slide-right-in_var(--dur-base)_var(--ease-out)] md:data-[state=closed]:animate-[slide-right-out_var(--dur-base)_var(--ease-out)]',
)

export function SheetLayer({ title, closeLabel, children, className, ...control }: LayerProps) {
  return (
    <Layer {...control}>
      <Primitive.Content
        aria-describedby={undefined}
        onCloseAutoFocus={control.onCloseAutoFocus}
        className={cn(panel, className)}
      >
        <Primitive.Title className="afiche pr-11 text-2xl text-ink">{title}</Primitive.Title>
        <div className="mt-4 flex flex-col items-start gap-2">{children}</div>
        <OverlayClose label={closeLabel} className="top-4 right-4" />
      </Primitive.Content>
    </Layer>
  )
}
