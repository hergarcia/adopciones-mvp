import { AVATAR_SIZE } from '@/lib/profile/avatar'
import { profileSchema } from '@/lib/schemas/profile'

export type ProviderIdentity = {
  provider: string
  identityData: Record<string, unknown> | null
}

// Lo que hay que comprobar no es que el correo de la persona esté confirmado —eso pudo haberlo
// puesto nuestro propio enlace semanas antes— sino que **Google**, en este ingreso, diga que esa
// dirección es de quien entró (FR-009a). El dato vive en la identidad del proveedor, que escribe
// el servicio al recibir los claims; `user_metadata` **no** sirve: lo edita la propia persona.
export function isVerifiedByGoogle(identities: readonly ProviderIdentity[]): boolean {
  const google = identities.find((identity) => identity.provider === 'google')
  if (google === undefined) return false

  return google.identityData?.['email_verified'] === true
}

export type ProfileSuggestion = {
  /** El nombre de la cuenta de Google, solo si sirve tal cual como nombre para mostrar. */
  displayName: string | null
  /** La foto de la cuenta de Google, pedida al tamaño en que se guarda la nuestra. */
  photoUrl: string | null
}

// Google ya los compartió en su propia pantalla de consentimiento, pero compartirlos con nosotros
// no es aceptar que se publiquen: el nombre llega escrito en el formulario y la foto espera a que
// la persona la elija. Nada se guarda hasta que la persona guarda su perfil (FR-030b).
export function profileSuggestionFrom(identities: readonly ProviderIdentity[]): ProfileSuggestion {
  const data = identities.find((identity) => identity.provider === 'google')?.identityData ?? {}

  return {
    displayName: suggestedName(data['full_name'] ?? data['name']),
    photoUrl: suggestedPhoto(data['avatar_url'] ?? data['picture']),
  }
}

// Un nombre que el formulario rechazaría no se sugiere: llegar a la pantalla con un error ya
// puesto en un campo que la persona no tocó es peor que el campo vacío.
function suggestedName(value: unknown): string | null {
  const parsed = profileSchema.shape.displayName.safeParse(value)
  return parsed.success ? parsed.data : null
}

// Google pone el tamaño al final de la dirección (`=s96-c`: 96 px, recortada al cuadrado), y a 96
// px la foto se vería borrosa en el tamaño en que se guarda.
const GOOGLE_SIZE = /=s\d+-c$/

function suggestedPhoto(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null
  return value.replace(GOOGLE_SIZE, `=s${AVATAR_SIZE}-c`)
}
