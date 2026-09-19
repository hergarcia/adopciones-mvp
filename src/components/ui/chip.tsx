import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

type GroupProps = {
  /** Nombre accesible del grupo de filtros, ya traducido. */
  label: string
  children: React.ReactNode
  className?: string
}

// Una sola fila que se desplaza: con más filtros de los que entran, la tira no se parte ni empuja
// la página. El espacio de abajo es el que ocupa la tirita arrancada al bajar e inclinarse.
export function ChipGroup({ label, children, className }: GroupProps) {
  return (
    <fieldset className={cn('perforado flex min-w-0 overflow-x-auto pb-3', className)}>
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  )
}

const chip = cva(
  'min-h-12 min-w-fit flex-1 shrink-0 border-r-2 border-dashed px-3 text-center text-sm font-medium whitespace-nowrap transition-transform duration-[var(--dur-base)] ease-out last:border-r-0',
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
