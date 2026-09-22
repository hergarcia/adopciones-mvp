export type SignInNotice = 'google_unverified' | 'google_cancelled'

export type SignInLayout = { notice: SignInNotice | null } & (
  { lead: 'email' } | { lead: 'google'; isEmailOpen: boolean }
)

// Qué camino encabeza la pantalla de ingreso y qué aviso la acompaña, juntos porque tienen que
// coincidir. Google adelante, salvo que no esté configurado (FR-011) o que acabe de no verificar
// la dirección: ahí el aviso dice que por Google no se entra, y ofrecerlo como acción principal lo
// contradiría. Cualquier otro motivo es un intento fallido que se puede repetir, así que Google
// sigue arriba y el correo queda abierto.
export function signInLayout(hasGoogle: boolean, motivo: string | undefined): SignInLayout {
  const notice = noticeFor(motivo)
  if (!hasGoogle || notice === 'google_unverified') return { lead: 'email', notice }
  return { lead: 'google', isEmailOpen: notice !== null, notice }
}

function noticeFor(motivo: string | undefined): SignInNotice | null {
  if (motivo === undefined) return null
  return motivo === 'google-sin-verificar' ? 'google_unverified' : 'google_cancelled'
}
