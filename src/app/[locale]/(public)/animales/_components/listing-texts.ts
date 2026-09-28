import { getTranslations } from 'next-intl/server'
import { DEPARTMENTS } from '@/lib/zones/departments'
import type { ListingTexts } from './listing-controller'

const MORE_COUNTS = [0, 1, 2, 3, 4, 5, 6]

// Los textos del listado, traducidos en el servidor y bajados por props: el cliente no carga los
// mensajes (constitución §VII). Los departamentos van por su nombre.
export async function listingTexts(): Promise<ListingTexts> {
  const t = await getTranslations('pets.listing')
  return {
    filters: {
      legends: {
        species: t('legends.species'),
        sex: t('legends.sex'),
        size: t('legends.size'),
        age: t('legends.age'),
        department: t('legends.department'),
        neutered: t('legends.neutered'),
      },
      options: {
        species: { dog: t('options.species.dog'), cat: t('options.species.cat') },
        sex: { male: t('options.sex.male'), female: t('options.sex.female') },
        size: {
          small: t('options.size.small'),
          medium: t('options.size.medium'),
          large: t('options.size.large'),
        },
        age: {
          puppy: t('options.age.puppy'),
          young: t('options.age.young'),
          adult: t('options.age.adult'),
          senior: t('options.age.senior'),
        },
        department: Object.fromEntries(DEPARTMENTS.map(({ code, name }) => [code, name])),
        neutered: { yes: t('options.neutered.yes') },
      },
      more: MORE_COUNTS.map((count) => t('more_filters', { count })),
      apply: t('apply'),
      clear: t('clear'),
    },
    loadMore: t('load_more'),
    loadMoreAgain: t('load_more_again'),
    cap: t('cap_240'),
    retry: t('retry'),
    previousFilters: t('previous_filters'),
    empty: t('empty'),
    emptyAction: t('empty_action'),
    emptyFiltered: t('empty_filtered'),
    loadError: t('load_error'),
    errors: { offline: t('errors.offline'), no_response: t('errors.no_response') },
  }
}
