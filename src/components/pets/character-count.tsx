import { cn } from '@/lib/cn'
import { countCharacters } from '@/lib/pets/char-count'
import { countText, type CountForms } from './pet-form-types'

type Props = {
  id: string
  value: string
  max: number
  /** Desde cuántos caracteres aparece. */
  from: number
  texts: { left: CountForms; over: CountForms }
}

// «Quedan 4» o «Sobran 12», atado al campo por su id. Lo que sobra no se corta: el texto queda
// entero y el contador dice cuánto hay que recortar (spec, Edge Cases).
export function CharacterCount({ id, value, max, from, texts }: Props) {
  const count = countCharacters(value.trim())
  if (count < from) return <span id={id} hidden />
  const over = count > max

  return (
    <p id={id} className={cn('text-sm', over ? 'font-medium text-accent' : 'text-ink-muted')}>
      {over ? countText(count - max, texts.over) : countText(max - count, texts.left)}
    </p>
  )
}
