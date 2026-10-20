import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

type GroupProps = {
  /** Nombre del grupo de filtros, ya traducido. */
  label: string
  children: React.ReactNode
  /**
   * `hidden`: solo para un lector de pantalla, cuando las opciones se explican solas. `beside`: a la
   * vista, a la izquierda de la tira, para que se distinga dónde termina un grupo y empieza otro.
   */
  legend?: 'hidden' | 'beside'
  className?: string
}

// Una sola tira que no se parte ni empuja la página: con más filtros de los que entran, se desplaza.
// El espacio de abajo es el que ocupa la tirita arrancada.
const strip = 'perforado flex min-w-0 overflow-x-auto pb-3 [scrollbar-width:none]'

/** El nombre de un grupo de filtros a la vista, a la izquierda de su control. */
export const groupLabel = 'shrink-0 text-sm font-bold text-ink'

export function ChipGroup({ label, children, legend = 'hidden', className }: GroupProps) {
  if (legend === 'hidden') {
    return (
      <fieldset className={cn(strip, className)}>
        <legend className="sr-only">{label}</legend>
        {children}
      </fieldset>
    )
  }
  // Flotada, la `legend` deja de dibujarse sobre el borde del `fieldset` y se acomoda como un ítem
  // más de la fila. El relleno de arriba la centra con la tirita de 48 px, que baja 2 px por la
  // perforación.
  return (
    <fieldset className={cn('flex min-w-0 items-start gap-3', className)}>
      <legend className={cn('float-left pt-4', groupLabel)}>{label}</legend>
      <div className={strip}>{children}</div>
    </fieldset>
  )
}

// El anillo de foco va por dentro: la tira es un contenedor con scroll y recortaría uno por fuera.
const base =
  'min-h-12 border-dashed px-3 text-sm font-medium whitespace-nowrap transition-[translate,rotate,background-color,color] duration-[var(--dur-base)] ease-out'

const chip = cva(
  cn(
    base,
    'min-w-fit flex-1 shrink-0 border-r-2 text-center last:border-r-0 focus-visible:-outline-offset-4',
  ),
  {
    variants: {
      active: {
        true: 'translate-y-2 rotate-[calc(var(--tilt-torn)*-1)] border-transparent bg-ink text-canvas focus-visible:outline-canvas',
        false: 'border-line bg-canvas text-ink hover:translate-y-1 active:translate-y-2',
      },
    },
    defaultVariants: { active: false },
  },
)

// La casilla: la tirita es el `span` que sigue al `input`, y se arranca con `:checked` (sin
// ejecutar nada, el formulario se manda igual). El `label` es `relative`: la casilla escondida es
// absoluta, y fuera de él ensancharía la página con las tiritas que la tira desplaza.
const box = cn(
  base,
  'flex items-center justify-center border-r-2 border-line bg-canvas text-ink group-last/chip:border-r-0 hover:translate-y-1',
  'peer-checked:translate-y-2 peer-checked:rotate-[calc(var(--tilt-torn)*-1)] peer-checked:border-transparent peer-checked:bg-ink peer-checked:text-canvas',
  'peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-ink peer-checked:peer-focus-visible:outline-canvas',
)

type ButtonProps = {
  /** Ya traducido. */
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

type CheckboxProps = {
  /** Ya traducido. */
  label: string
  name: string
  value: string
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

type Props = ButtonProps | CheckboxProps

// Un botón que se marca, o —con `name` y `value`— una casilla de un formulario, que un lector de
// pantalla anuncia como «casilla, marcada». Las dos se ven igual.
export function Chip(props: Props) {
  if ('name' in props) {
    const { label, name, value, checked, onCheckedChange, className } = props
    return (
      <label
        className={cn(
          'group/chip relative flex min-w-fit flex-1 shrink-0 cursor-pointer',
          className,
        )}
      >
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
          className="peer sr-only"
        />
        <span className={cn(box, 'w-full')}>{label}</span>
      </label>
    )
  }
  const { label, active = false, onClick, className } = props
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
