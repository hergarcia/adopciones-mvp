import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

type GroupProps = {
  /** Nombre accesible del grupo de filtros, ya traducido. */
  label: string
  children: React.ReactNode
  className?: string
}

// La tira de tiritas para arrancar del cartel, con su línea perforada arriba.
export function ChipGroup({ label, children, className }: GroupProps) {
  return (
    <fieldset className={cn('perforado flex min-w-0 pb-2', className)}>
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  )
}

// La activa se llena de tinta, baja y se inclina: está arrancada.
const chip = cva(
  'min-h-12 flex-1 border-r-2 border-dashed px-1 text-center text-sm font-medium transition-transform duration-[var(--dur-base)] ease-out last:border-r-0',
  {
    variants: {
      active: {
        true: 'translate-y-2 rotate-[calc(var(--tilt-torn)*-1)] border-transparent bg-ink text-canvas',
        false: 'border-line bg-canvas text-ink hover:translate-y-1',
      },
    },
    defaultVariants: { active: false },
  },
)

type Props = {
  /** Ya traducido. */
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

export function Chip({ label, active = false, onClick, className }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(chip({ active }), className)}
    >
      {label}
    </button>
  )
}
