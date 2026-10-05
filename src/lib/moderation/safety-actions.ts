export type SafetyAction = 'report' | 'block' | 'unblock' | 'suspend'

export type SafetyViewer = { isOwner: boolean; isAdmin: boolean } | null

/** Qué botones lleva el pie del perfil, y si llevan a ingresar en lugar de actuar. */
export type SafetyActions = { actions: SafetyAction[]; signIn: boolean }

// Lo que se puede hacer sobre otra persona desde su perfil (spec §Pantallas): nada en el propio;
// reportar y bloquear con o sin sesión (sin sesión, para ingresar y volver); suspender solo quien
// administra. En el perfil bloqueado, desbloquear en lugar de bloquear: bloquear no le quita a
// quien administra la herramienta de suspender (Edge Cases).
export function safetyActions(input: {
  viewer: SafetyViewer
  view: 'profile' | 'blocked'
}): SafetyActions {
  const { viewer, view } = input
  if (viewer === null) return { actions: ['report', 'block'], signIn: true }
  if (viewer.isOwner) return { actions: [], signIn: false }
  const actions: SafetyAction[] = view === 'blocked' ? ['unblock', 'report'] : ['report', 'block']
  return { actions: viewer.isAdmin ? [...actions, 'suspend'] : actions, signIn: false }
}
