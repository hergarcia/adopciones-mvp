import type { LeavingTexts } from '@/components/forms/leaving-dialog'
import type { LocalityTexts } from '@/components/zones/locality-field'
import type { AvatarTexts } from './avatar-field'
import type { PersonalDataTexts } from './personal-data-notice'

export type ProfileFormTexts = {
  nameLabel: string
  namePlaceholder: string
  nameFromGoogle: string
  /** Que el nombre y la localidad los ve cualquiera y no llevan contacto (FR-021). */
  publicHint: string
  departmentLabel: string
  departmentPlaceholder: string
  localityLabel: string
  localityLabelMontevideo: string
  locality: LocalityTexts
  rescuerLabel: string
  submit: string
  errors: Record<string, string>
  avatar: AvatarTexts
  leaving: ProfileLeavingTexts
  saveFailed: SaveFailedTexts
  dataNotice: PersonalDataTexts
}

/** El aviso de salir con cambios sin guardar (FR-023). */
export type ProfileLeavingTexts = LeavingTexts & {
  /** En el alta, donde el borrador guarda todo menos la foto elegida (FR-015). */
  bodyPhoto: string
}

/** El aviso de un guardado que no llegó: un texto por motivo y la tirita de la sesión cerrada. */
export type SaveFailedTexts = {
  offline: string
  noResponse: string
  /** Al editar: lo cambiado no sobrevive a volver a entrar, y el aviso lo dice antes (FR-008). */
  session: string
  /** En el alta, donde el borrador sobrevive a volver a entrar. */
  sessionDraft: string
  /** Lo mismo, con una foto elegida: la foto no va al borrador (FR-015). */
  sessionDraftPhoto: string
  signIn: string
}

export type ProfileFormValues = {
  displayName: string
  department: string
  locality: string
  isRescuer: boolean
  avatarUrl: string | null
}
