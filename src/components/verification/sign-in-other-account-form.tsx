'use client'

import { useId } from 'react'
import { signInWithOtherAccount } from '@/actions/phone-claim'
import { clearProfileDraft } from '@/hooks/use-profile-draft'
import { FormSubmit } from './form-submit'

type Props = {
  texts: { label: string; note: string }
  /** La puerta tal como llegó en la URL, para volver con ella si no se pudo cerrar la sesión. */
  gate: { para?: string; next?: string; desde?: string }
}

// Un formulario del servidor: sin JavaScript cierra la sesión igual. La hoja cliente existe para
// llevarse el borrador del perfil de este navegador, como toda salida de una cuenta, y la
// aclaración va atada al botón: se sabe antes de tocarlo que cierra esta sesión (US3-AS1).
export function SignInOtherAccountForm({ texts, gate }: Props) {
  const noteId = useId()
  return (
    <form
      action={signInWithOtherAccount}
      onSubmit={clearProfileDraft}
      className="flex flex-col items-start gap-2"
    >
      {gate.para ? <input type="hidden" name="para" value={gate.para} /> : null}
      {gate.next ? <input type="hidden" name="next" value={gate.next} /> : null}
      {gate.desde ? <input type="hidden" name="desde" value={gate.desde} /> : null}
      <FormSubmit label={texts.label} variant="secondary" describedBy={noteId} />
      <p id={noteId} className="text-sm text-ink-muted">
        {texts.note}
      </p>
    </form>
  )
}
