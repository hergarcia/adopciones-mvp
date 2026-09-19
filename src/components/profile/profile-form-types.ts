import type { AvatarTexts } from './avatar-field'
import type { LocalityTexts } from './locality-field'

export type ProfileFormTexts = {
  nameLabel: string
  namePlaceholder: string
  departmentLabel: string
  departmentPlaceholder: string
  localityLabel: string
  localityLabelMontevideo: string
  locality: LocalityTexts
  rescuerLabel: string
  submit: string
  saved: string
  errors: Record<string, string>
  avatar: AvatarTexts
  toastClose: string
  toastLabel: string
  toastRegion: string
}

export type ProfileFormValues = {
  displayName: string
  department: string
  locality: string
  isRescuer: boolean
  avatarUrl: string | null
}
