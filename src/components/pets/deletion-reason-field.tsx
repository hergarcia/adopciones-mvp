import { RadioGroup } from '@/components/ui/radio-group'
import { DELETION_REASONS } from '@/lib/pets/deletion-reason'
import type { DeletionReasonTexts } from './deletion-reason-texts'

type Props = {
  texts: DeletionReasonTexts
  /** Vacío: ninguna elegida, que es como arranca. */
  value: string
  onChange: (value: string) => void
  /** Mientras se borra: cuenta lo que estaba elegido al tocar «Borrar para siempre». */
  disabled: boolean
}

// «¿Por qué lo borrás?» dentro de la confirmación de borrar (historia #263). Las cinco casillas
// pesan igual a propósito: una destacada empujaría la respuesta. Tocar la elegida la deja sin
// elegir, porque contestar es opcional.
export function DeletionReasonField({ texts, value, onChange, disabled }: Props) {
  return (
    <RadioGroup
      legend={texts.title}
      hint={texts.hint}
      name="deletion-reason"
      options={DELETION_REASONS.map((reason) => ({ value: reason, label: texts.options[reason] }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
      orientation="column"
      clearable
    />
  )
}
