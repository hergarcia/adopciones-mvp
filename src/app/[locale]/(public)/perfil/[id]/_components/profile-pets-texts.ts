import { getTranslations } from 'next-intl/server'
import type { ProfilePetsTexts } from '@/components/pets/profile-pets'

// «Ver más» y sus fallas dicen lo mismo que en el listado: se leen de ahí y no se copian.
export async function profilePetsTexts(): Promise<ProfilePetsTexts> {
  const [t, listing] = await Promise.all([
    getTranslations('profile.public.pets'),
    getTranslations('pets.listing'),
  ])
  return {
    title: t('title'),
    loadMore: listing('load_more'),
    cap: t('cap'),
    retry: t('retry'),
    loadError: t('load_error'),
    moreFailed: {
      offline: listing('more_failed', { reason: 'offline' }),
      no_response: listing('more_failed', { reason: 'no_response' }),
    },
  }
}
