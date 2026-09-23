import { Input } from '@/components/ui/input'

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error: string | undefined
  /** "Te quedan 3 intentos", atado al renglón para que se lea junto con el error. */
  attempts: string | null
}

// Un solo campo y no seis casillas: así el teléfono sugiere el código del mensaje y se puede pegar
// entero.
export function CodeField({ id, label, value, onChange, error, attempts }: Props) {
  const attemptsId = `${id}-attempts`
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{label}</span>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={16}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="text-2xl tabular-nums"
          error={error}
          aria-describedby={attempts ? attemptsId : undefined}
        />
      </label>
      {attempts ? (
        <p id={attemptsId} className="text-sm text-ink">
          {attempts}
        </p>
      ) : null}
    </div>
  )
}
