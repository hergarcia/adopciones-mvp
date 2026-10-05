import { cn } from '@/lib/cn'
import { countCharacters } from '@/lib/pets/char-count'

/** Una cuenta con sus dos formas, con `{count}` en la de plural: la elige el navegador. */
export type CountForms = { one: string; many: string }

export function countText(count: number, forms: CountForms): string {
  return count === 1 ? forms.one : forms.many.replace('{count}', String(count))
}

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
