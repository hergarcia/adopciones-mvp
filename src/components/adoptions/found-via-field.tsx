import { RadioGroup } from '@/components/ui/radio-group'
import { FOUND_VIA_OPTIONS, type FoundVia } from '@/lib/adoptions/found-via'

export type FoundViaTexts = {
  title: string
  hint: string
  options: Record<FoundVia, string>
}

type Props = {
  texts: FoundViaTexts
  /** Vacío: ninguna elegida, que es como arranca. */
  value: string
  onChange: (value: string) => void
  /** Mientras marca: cuenta lo que estaba elegido al tocar el botón. */
  disabled: boolean
}

// «¿Por dónde te encontró?» en el camino por fuera de marcar adoptado (historia #254). Las seis
// casillas pesan igual a propósito: una destacada empujaría la respuesta. Tocar la elegida la deja
// sin elegir, porque contestar es opcional.
export function FoundViaField({ texts, value, onChange, disabled }: Props) {
  return (
    <RadioGroup
      legend={texts.title}
      legendSize="sm"
      hint={texts.hint}
      name="found-via"
      options={FOUND_VIA_OPTIONS.map((option) => ({ value: option, label: texts.options[option] }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
      orientation="column"
      clearable
    />
  )
}
