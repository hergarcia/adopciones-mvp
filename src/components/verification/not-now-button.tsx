import { leaveVerification } from '@/actions/verification-exit'
import type { ExitLevel } from '@/lib/verification/exit-question'
import { FormSubmit } from './form-submit'

type Props = {
  level: ExitLevel
  /** La pantalla desde la que se toca, con su consulta: de ahí salen la puerta y el animal. */
  from: string
  label: string
}

// «Ahora no» cuando todavía hay que preguntar qué frena (historia #234): hacer la pregunta escribe,
// y una escritura no va en un enlace, que los navegadores precargan. Mismo lugar y mismo texto que
// `NotNowLink`; un formulario de verdad, así funciona sin JavaScript.
export function NotNowButton({ level, from, label }: Props) {
  return (
    <form action={leaveVerification} className="mt-8 self-start">
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="from" value={from} />
      <FormSubmit label={label} variant="ghost" />
    </form>
  )
}
