import { cn } from '@/lib/cn'
import { ErrorText } from './input'

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  error?: string
  className?: string
}

export function Textarea({ error, className, id, ...rest }: Props) {
  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          'min-h-24 rounded-control border bg-canvas p-3 text-base text-ink transition-colors duration-[var(--dur-fast)] ease-out placeholder:text-ink-muted focus:border-primary disabled:opacity-50',
          error ? 'border-accent' : 'border-line',
          className,
        )}
        {...rest}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}
