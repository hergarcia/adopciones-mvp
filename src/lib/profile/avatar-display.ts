import { initials } from './initials'

export type AvatarContent = { kind: 'photo'; url: string } | { kind: 'initials'; text: string }

// La decisión de FR-024: con foto se muestra la foto, sin foto las iniciales. Vive acá y no en el
// componente porque lo que vale la pena probar es la decisión, no el markup (docs/09).
export function avatarContent(url: string | null, displayName: string): AvatarContent {
  return url === null ? { kind: 'initials', text: initials(displayName) } : { kind: 'photo', url }
}
