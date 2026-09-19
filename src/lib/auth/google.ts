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
