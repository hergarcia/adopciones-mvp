import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/config'
import { SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { siteShareVersion } from '@/lib/og/site-share-version'
import { isPublisherLevel } from '@/lib/pets/publisher-level'
import type { VerificationLevel } from '@/lib/verification/level'
import { PUBLIC_PROFILE_SEGMENT } from './public-paths'

/** Los niveles que tienen imagen de vista previa: con 0 no hay nada que mostrar. */
export type ShareLevel = 1 | 2 | 3

const SHARE_LEVELS: ReadonlyMap<string, ShareLevel> = new Map<string, ShareLevel>([
  ['1', 1],
  ['2', 2],
  ['3', 3],
])

/** El segmento de la ruta de la imagen como nivel, o null si no es exactamente 1, 2 o 3. */
export function parseShareLevel(segment: string): ShareLevel | null {
  return SHARE_LEVELS.get(segment) ?? null
}

export function profileLevelImagePath(level: ShareLevel, version: string): string {
  return `/${PUBLIC_PROFILE_SEGMENT}/nivel/${level}/imagen?v=${version}`
}

type ProfileShare = {
  level: VerificationLevel | null
  /** El título de la tarjeta, con el sitio: el mismo de `og:title`. */
  title: string
  /** El nivel en las palabras de la chapita, ya traducido; null sin nivel. */
  levelText: string | null
}

type ProfileShareMetadata = Pick<Metadata, 'description' | 'twitter'> & {
  openGraph?: {
    description: string
    images: { url: string; width: number; height: number; type: string; alt: string }[]
  }
}

// Lo que el nivel suma a la vista previa del perfil (historia #280). Sin nivel, o sin poder saberlo,
// nada: la vista previa queda con el nombre y el sitio, y nunca dice «Todavía no se verificó», que
// expondría a la persona frente a un grupo entero. La imagen depende solo del nivel, no de quién es.
export function profileShareMetadata({
  level,
  title,
  levelText,
}: ProfileShare): ProfileShareMetadata {
  if (!isPublisherLevel(level) || levelText === null) return {}
  const url = profileLevelImagePath(
    level,
    siteShareVersion({ siteName: APP_NAME, phrase: levelText }),
  )
  return {
    description: levelText,
    openGraph: {
      description: levelText,
      images: [{ url, ...SHARE_IMAGE_SIZE, type: 'image/jpeg', alt: levelText }],
    },
    twitter: { card: 'summary_large_image', title, description: levelText, images: [url] },
  }
}
