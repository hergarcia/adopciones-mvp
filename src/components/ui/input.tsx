import { cn } from '@/lib/cn'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  /** Mensaje de error, ya traducido. Entra debajo del campo, en el acento. */
  error?: string
  className?: string
}

// 16 px como mínimo para que iOS no haga zoom al enfocar. El borde toma el primario al foco; el
// error entra debajo (docs/10 §Componentes).
export function Input({ error, className, id, ...rest }: Props) {
  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          'min-h-11 rounded-control border bg-canvas px-3 text-base text-ink transition-colors duration-[var(--dur-fast)] ease-out placeholder:text-ink-muted focus:border-primary disabled:opacity-50',
          error ? 'border-accent' : 'border-line',
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
    <p id={id} className="animate-[fade-in_var(--dur-base)_var(--ease-out)] text-sm text-accent">
      {children}
    </p>
  )
}
