import type { AvatarTexts } from './avatar-field'
import type { LocalityTexts } from './locality-field'

export type ProfileFormTexts = {
  nameLabel: string
  namePlaceholder: string
  nameFromGoogle: string
  departmentLabel: string
  departmentPlaceholder: string
  localityLabel: string
  localityLabelMontevideo: string
  locality: LocalityTexts
  rescuerLabel: string
  submit: string
  errors: Record<string, string>
  avatar: AvatarTexts
  leaving: LeavingTexts
  saveFailed: SaveFailedTexts
}

/** El aviso de salir con cambios sin guardar (FR-023). */
export type LeavingTexts = {
  title: string
  body: string
  stay: string
  leave: string
  close: string
}

/** El aviso de un guardado que no llegó: un texto por motivo y las dos salidas. */
export type SaveFailedTexts = {
  offline: string
  noResponse: string
  session: string
  /** En el alta, donde el borrador sobrevive a volver a entrar. */
  sessionDraft: string
  /** Lo mismo, con una foto elegida: la foto no va al borrador (FR-015). */
  sessionDraftPhoto: string
  retry: string
  signIn: string
}

export type ProfileFormValues = {
  displayName: string
  department: string
  locality: string
  isRescuer: boolean
  avatarUrl: string | null
}
