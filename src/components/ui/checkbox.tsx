import { cn } from '@/lib/cn'
import { CheckIcon } from './icons'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  /** La etiqueta, ya traducida. */
  label: React.ReactNode
  className?: string
}

// Una casilla de papel: cuadrada como todo acá, con el trazo de tinta de 2 px y el tilde dibujado
// encima. Va sobre el input nativo, que ya trae foco, teclado, `:checked` y el envío del
// formulario; una librería no agregaría nada y sí peso.
export function Checkbox({ label, className, ...rest }: Props) {
  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 text-base text-ink',
        rest.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="relative grid size-5 shrink-0 place-items-center">
        <input
          {...rest}
          type="checkbox"
          className="peer size-5 appearance-none border-2 border-ink bg-canvas transition-colors duration-[var(--dur-fast)] ease-out checked:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        <CheckIcon className="pointer-events-none absolute size-4 text-canvas opacity-0 transition-opacity duration-[var(--dur-fast)] ease-out peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  )
}
