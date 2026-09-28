// Qué se pierde al salir del formulario del perfil sin guardar: decide si se pregunta antes y qué
// se dice (FR-023 de #9, FR-007). En el alta, el borrador de este navegador guarda todo menos la
// foto elegida (FR-014, FR-015), así que salir se deshace volviendo; y `Dialog` es solo para lo
// que no se deshace (docs/10 §Componentes).
export type LeavingLoss = 'nothing' | 'photo' | 'changes'

export function leavingLoss(form: {
  /** Este navegador está guardando el borrador del alta. */
  keepsDraft: boolean
  /** La pantalla tiene cambios sin guardar, un guardado fallido incluido. */
  changed: boolean
  photoPicked: boolean
}): LeavingLoss {
  if (form.keepsDraft) return form.photoPicked ? 'photo' : 'nothing'
  return form.changed ? 'changes' : 'nothing'
}
