import { cn } from '@/lib/cn'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  /** Mensaje de error, ya traducido. Entra debajo del campo, en el acento. */
  error?: string
  className?: string
}

// Un renglón de formulario de papel: sin caja, una línea de tinta abajo que engrosa al foco. La
// sombra de abajo engrosa la línea sin mover el layout. 16 px como mínimo para que iOS no haga
// zoom al enfocar (docs/10 §Componentes).
export const fieldLine =
  'border-0 border-b-2 bg-transparent text-base text-ink transition-shadow duration-[var(--dur-fast)] ease-out placeholder:text-ink-muted focus:shadow-[0_2px_0_0_var(--color-ink)] disabled:opacity-50'

export function Input({ error, className, id, ...rest }: Props) {
  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          fieldLine,
          'min-h-11 px-0',
          error ? 'border-accent focus:shadow-[0_2px_0_0_var(--color-accent)]' : 'border-ink',
          className,
        )}
        {...rest}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}

type ErrorTextProps = {
  id?: string
  children: React.ReactNode
}

export function ErrorText({ id, children }: ErrorTextProps) {
  return (
    <p
      id={id}
      className="animate-[fade-in_var(--dur-base)_var(--ease-out)] text-sm font-medium text-accent"
    >
      {children}
    </p>
  )
}
