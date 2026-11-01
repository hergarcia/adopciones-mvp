import { getTranslations } from 'next-intl/server'
import { readPetStats } from '@/actions/pet-stats'
import { PetStatsLive } from '@/components/pets/pet-stats-live'
import type { PublicationKind } from '@/lib/pet-stats/types'

type Props = { kind: PublicationKind; id: string; name: string }

// Trae los números de «Cómo le va a…» dentro de su `Suspense`: mientras tarda, o si falla, el resto
// de la página ya anda (FR-018, FR-019).
export async function PetStatsSection({ kind, id, name }: Props) {
  const [initial, t] = await Promise.all([
    readPetStats({ kind, id }),
    getTranslations('pets.stats'),
  ])
  return (
    <PetStatsLive
      request={{ kind, id }}
      initial={initial}
      texts={{ title: t('title', { name }), error: t('load_error'), retry: t('retry') }}
    />
  )
}
