import type { Publisher } from '@/lib/pets/types'
import { publicProfilePath } from '@/lib/profile/public-paths'

/** El perfil público de quien publicó, adonde lleva su nombre en la ficha (historia #238). */
export function publisherHref(publisher: Publisher): string | undefined {
  return publisher.publicId === null ? undefined : publicProfilePath(publisher.publicId)
}
