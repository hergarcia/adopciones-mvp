import { cn } from '@/lib/cn'
import { FieldShell } from './field-shell'

export type RadioOption = {
  value: string
  /** Ya traducida. */
  label: string
}

type Props = {
  /** Del `fieldset`, para llevarle el foco desde afuera. */
  id?: string
  /** Ya traducida: la pregunta del grupo. */
  legend: string
  name: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Ya traducido. */
  error?: string
  disabled?: boolean
  className?: string
}

// Una fila de casillas de papel sobre radios nativos, que ya traen el teclado de las flechas, el
// foco y el envío del formulario. La elegida se llena de tinta: es una marca, no una tirita
// arrancada, así que no se inclina ni baja. El radio cubre la casilla entera, así el anillo de foco
// y el toque son de toda la casilla (44 px).
export function RadioGroup({
  id,
  legend,
  name,
  options,
  value,
  defaultValue,
  onChange,
  error,
  disabled,
  className,
}: Props) {
  return (
    <FieldShell error={error}>
      {(errorId) => (
        <fieldset
          id={id}
          aria-describedby={errorId}
          disabled={disabled}
          className={cn('flex min-w-0 flex-col gap-2 disabled:opacity-50', className)}
        >
          <legend className="mb-2 text-sm text-ink-muted">{legend}</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-2 px-4 text-base text-ink transition-colors duration-[var(--dur-fast)] ease-out not-has-[:checked]:hover:bg-surface has-[:checked]:bg-ink has-[:checked]:text-canvas has-[:disabled]:cursor-not-allowed',
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
