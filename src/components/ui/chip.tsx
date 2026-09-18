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

type Props = {
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

// Una tirita. La activa se llena de tinta, baja y se inclina: está arrancada.
export function Chip({ label, active = false, onClick, className }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-12 flex-1 border-r-2 border-dashed border-line px-1 text-center text-sm font-medium transition-transform duration-[var(--dur-base)] ease-out last:border-r-0',
        active
          ? 'translate-y-2 rotate-[calc(var(--tilt)*-2.5)] border-transparent bg-ink text-canvas'
          : 'bg-canvas text-ink hover:translate-y-1',
        className,
      )}
    >
      {label}
    </button>
  )
}
