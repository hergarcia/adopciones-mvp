import type { Publisher } from './types'

// La imagen dice el nivel de quien publicó, así que su versión también: con un aval retirado la URL
// cambia y las apps piden la imagen nueva en lugar de seguir mostrando un nivel que ya no tiene.
export function shareImageVersion(version: string, level: Publisher['level']): string {
  return `${version}-${level ?? 0}`
}
