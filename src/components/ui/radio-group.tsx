import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { useId } from 'react'
import { FieldShell, describedBy } from './field-shell'

export type RadioOption = {
  value: string
  /** Ya traducida; una opción con más que un texto, como una persona con su foto, lo arma afuera. */
  label: React.ReactNode
}

// En fila se parten en renglones; en columna, cada casilla es una línea a lo ancho, para opciones
// largas que en fila quedarían desparejas.
const optionsVariants = cva('flex gap-2', {
  variants: {
    orientation: { row: 'flex-wrap', column: 'flex-col' },
  },
})

// `lg` cuando la pregunta es todo el contenido de la pantalla, como un paso del cuestionario.
export const legendVariants = cva('', {
  variants: {
    size: { sm: 'text-sm text-ink-muted', lg: 'text-lg text-ink' },
  },
  defaultVariants: { size: 'sm' },
})

const optionVariants = cva(
  'relative inline-flex min-h-11 min-w-11 cursor-pointer items-center border-2 px-4 text-base text-ink transition-colors duration-[var(--dur-fast)] ease-out not-has-[:checked]:hover:bg-surface has-[:checked]:bg-ink has-[:checked]:text-canvas has-[:disabled]:cursor-not-allowed',
  {
    variants: {
      orientation: { row: 'justify-center', column: 'justify-start py-2 text-left' },
    },
  },
)

type Props = {
  /** Del `fieldset`, para llevarle el foco desde afuera. */
  id?: string
  /** Ya traducida: la pregunta del grupo. */
  legend: string
  /** Ya traducida: una línea debajo de la pregunta, atada al grupo con `aria-describedby`. */
  hint?: string
  name: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Ya traducido. */
  error?: string
  disabled?: boolean
  /** `row` por defecto; `column` para opciones largas. */
  orientation?: 'row' | 'column'
  /** `sm` por defecto; `lg` cuando la pregunta es el contenido de la pantalla. */
  legendSize?: 'sm' | 'lg'
  /**
   * Tocar la elegida la deja sin elegir y llama `onChange('')`: para una pregunta opcional donde
   * ninguna viene elegida. Solo con `value`; un radio nativo no se destilda solo.
   */
  clearable?: boolean
  className?: string
}

// Una fila de casillas de papel sobre radios nativos, que ya traen el teclado de las flechas, el
// foco y el envío del formulario. La elegida se llena de tinta: es una marca, no una tirita
// arrancada, así que no se inclina ni baja. El radio cubre la casilla entera, así el anillo de foco
// y el toque son de toda la casilla (44 px). Con `clearable`, el `click` sobre la elegida la
// destilda: lo disparan el toque, el mouse y la barra espaciadora; las flechas eligen otra, así que
// nunca caen sobre la que ya estaba.
export function RadioGroup({
  id,
  legend,
  hint,
  name,
  options,
  value,
  defaultValue,
  onChange,
  error,
  disabled,
  orientation = 'row',
  legendSize,
  clearable,
  className,
}: Props) {
  const hintId = `${useId()}-hint`
  return (
    <FieldShell error={error}>
      {(errorId) => (
        <fieldset
          id={id}
          aria-describedby={describedBy(hint ? hintId : undefined, errorId)}
          disabled={disabled}
          className={cn('flex min-w-0 flex-col gap-2 disabled:opacity-50', className)}
        >
          <legend className={cn(hint ? 'mb-1' : 'mb-2', legendVariants({ size: legendSize }))}>
            {legend}
          </legend>
          {hint ? (
            <p id={hintId} className="text-sm text-ink-muted">
              {hint}
            </p>
          ) : null}
          <div className={optionsVariants({ orientation })}>
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  optionVariants({ orientation }),
                  error ? 'border-accent' : 'border-ink',
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === undefined ? undefined : value === option.value}
                  defaultChecked={
                    defaultValue === undefined ? undefined : defaultValue === option.value
                  }
                  onChange={onChange ? () => onChange(option.value) : undefined}
                  onClick={
                    clearable && onChange && value === option.value ? () => onChange('') : undefined
                  }
                  readOnly={value !== undefined && onChange === undefined}
                  className="absolute inset-0 cursor-[inherit] appearance-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </FieldShell>
  )
}
