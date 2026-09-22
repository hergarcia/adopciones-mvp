export type SignInLayout = { lead: 'email' } | { lead: 'google'; isEmailOpen: boolean }

// Qué camino encabeza la pantalla de ingreso. Google, salvo que no esté configurado (FR-011) o que
// acabe de no verificar la dirección: ahí el aviso dice que por Google no se puede entrar, y
// seguir ofreciéndolo como acción principal lo contradiría. Cualquier otro motivo es un intento
// fallido que se puede repetir, así que Google sigue arriba y el correo queda abierto a mano.
export function signInLayout(hasGoogle: boolean, motivo: string | undefined): SignInLayout {
  if (!hasGoogle || motivo === 'google-sin-verificar') return { lead: 'email' }
  return { lead: 'google', isEmailOpen: motivo !== undefined }
}
