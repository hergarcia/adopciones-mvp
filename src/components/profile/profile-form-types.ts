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
}

/** El aviso de salir con cambios sin guardar (FR-023). */
export type LeavingTexts = {
  title: string
  body: string
  stay: string
  leave: string
  close: string
}

export type ProfileFormValues = {
  displayName: string
  department: string
  locality: string
  isRescuer: boolean
  avatarUrl: string | null
}
