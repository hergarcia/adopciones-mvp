import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

type GroupProps = {
  /** Nombre accesible del grupo de filtros, ya traducido. */
  label: string
  children: React.ReactNode
  /**
   * `horizontal`: una fila que se desplaza, la de siempre. `vertical`: desde 1024, una columna de
   * tiritas a lo ancho del poste (docs/10 §Pantallas anchas); debajo, la fila de siempre.
   */
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

// Una sola tira que no se parte ni empuja la página: con más filtros de los que entran, se desplaza.
// El espacio de abajo (o, en la columna, a la derecha) es el que ocupa la tirita arrancada.
export function ChipGroup({ label, children, orientation = 'horizontal', className }: GroupProps) {
  return (
    <fieldset
      data-orientation={orientation}
      className={cn(
        'group/chips perforado flex min-w-0 overflow-x-auto pb-3 [scrollbar-width:none]',
        orientation === 'vertical' &&
          'lg:flex-col lg:overflow-visible lg:border-t-0 lg:border-l-2 lg:border-dashed lg:pr-3 lg:pb-0',
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {children}
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
// absoluta, y fuera de él ensancharía la página con las tiritas que la tira desplaza. En la columna del poste la arrancada se corre a la
// derecha en lugar de bajar.
const box = cn(
  base,
  'flex items-center justify-center border-r-2 border-line bg-canvas text-ink group-last/chip:border-r-0 hover:translate-y-1',
  'peer-checked:translate-y-2 peer-checked:rotate-[calc(var(--tilt-torn)*-1)] peer-checked:border-transparent peer-checked:bg-ink peer-checked:text-canvas',
  'peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-ink peer-checked:peer-focus-visible:outline-canvas',
  'lg:group-data-[orientation=vertical]/chips:justify-start lg:group-data-[orientation=vertical]/chips:border-r-0 lg:group-data-[orientation=vertical]/chips:border-b-2 lg:group-data-[orientation=vertical]/chips:group-last/chip:border-b-0 lg:group-data-[orientation=vertical]/chips:hover:translate-x-1 lg:group-data-[orientation=vertical]/chips:hover:translate-y-0',
  'lg:group-data-[orientation=vertical]/chips:peer-checked:translate-x-2 lg:group-data-[orientation=vertical]/chips:peer-checked:translate-y-0',
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
