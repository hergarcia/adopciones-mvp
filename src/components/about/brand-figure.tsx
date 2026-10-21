import { BrandMark } from '@/components/ui/brand-mark'
import { cn } from '@/lib/cn'

type Props = {
  /** Lo que anuncia el lector de pantalla en lugar del dibujo. */
  label: string
  /** Solo dónde se ve: en el teléfono va con su parte y desde 1024 al costado. */
  className?: string
}

// La única vez que la marca aparece grande: la principal a 128 px, sola, quieta y en tinta (docs/10
// §Marca). Acá el dibujo es el tema y no hay nombre al lado, así que deja de ser decorativo y se
// anuncia con lo que representa. El SVG va inline con su alto fijo: el texto no se corre (FR-024).
export function BrandFigure({ label, className }: Props) {
  return (
    <BrandMark
      version="principal"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- un SVG inline en currentColor no puede ser un <img>; role="img" es su forma accesible
      role="img"
      aria-label={label}
      aria-hidden={false}
      className={cn('h-32 w-auto text-ink', className)}
    />
  )
}
