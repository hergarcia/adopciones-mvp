import { petInboxPath } from './paths'

/**
 * El camino a las solicitudes de un animal o una cría en «Mis animales»: «2 solicitudes nuevas» o
 * «Ver solicitudes», o null si nadie lo pidió (#65, FR-026 de la #206).
 */
export function inboxLinkOf(
  petId: string,
  counts: { fresh: number; total: number } | undefined,
  labels: { fresh: (count: number) => string; all: string },
): { href: string; label: string } | null {
  if (counts === undefined || counts.total === 0) return null
  return {
    href: petInboxPath(petId),
    label: counts.fresh > 0 ? labels.fresh(counts.fresh) : labels.all,
  }
}
