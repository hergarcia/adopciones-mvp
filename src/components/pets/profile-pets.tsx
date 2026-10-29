'use client'

import { useId, useReducer, useSyncExternalStore } from 'react'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { useListingPages } from '@/hooks/use-listing-pages'
import { loadMoreState } from '@/lib/pets/listing-page'
import type { ApiPage, ListingFailure } from '@/lib/pets/listing-requests'
import {
  profilePetsApiHref,
  profilePetsInitial,
  profilePetsMoreHref,
  profilePetsReducer,
} from '@/lib/pets/profile-pets-state'
import { LISTING_PAGE_SIZE } from '@/lib/pets/rules'
import { LoadMoreButton } from './load-more-button'
import { PetPhoto } from './pet-photo'
import { PetWall } from './pet-wall'
import { PetWallSkeleton } from './pet-wall-skeleton'

export type ProfilePetsTexts = {
  title: string
  loadMore: string
  cap: string
  retry: string
  loadError: string
  moreFailed: Record<ListingFailure, string>
}

type Props = {
  publicId: string
  /** La primera tanda que trajo el servidor; `null` si la base no respondió. */
  first: ApiPage | null
  texts: ProfilePetsTexts
}

const noChanges = () => () => {}

// «En adopción» en el perfil público (research R5): la primera tanda llega con la página y se lee sin
// scripts; con el navegador que ejecuta, «Ver más» suma y «Probar de nuevo» vuelve a pedir la primera.
// Si después de probar de nuevo no hay ninguno, la sección entera se va, con su título.
export function ProfilePets({ publicId, first, texts }: Props) {
  const titleId = useId()
  const [state, dispatch] = useReducer(profilePetsReducer, first, profilePetsInitial)
  const hydrated = useSyncExternalStore(
    noChanges,
    () => true,
    () => false,
  )
  const request = useListingPages()
  const { cards, failure, pending } = state

  async function run(kind: 'retry' | 'more', cursor: string | null) {
    dispatch({ type: kind === 'retry' ? 'retry_started' : 'more_started' })
    const result = await request(profilePetsApiHref(publicId, cursor))
    // Abortado solo queda uno que reemplazó otro pedido: el nuevo es el que cierra lo pendiente.
    if (result.kind === 'loaded') dispatch({ type: 'loaded', page: result.page })
    if (result.kind === 'failed') dispatch({ type: 'failed', reason: result.reason })
  }

  if (cards.length === 0 && failure === null && pending === 'none') return null

  return (
    <section aria-labelledby={titleId} className="flex flex-col items-start gap-6">
      <h2 id={titleId} className="text-lg font-bold text-ink">
        {texts.title}
      </h2>
      {failure?.on === 'open' ? (
        <div className="flex w-full flex-col items-start gap-3">
          <SaveFailedStrip attempt={state.request} message={texts.loadError} />
          <Button
            variant="secondary"
            loading={pending === 'retry'}
            onClick={() => void run('retry', null)}
          >
            {texts.retry}
          </Button>
        </div>
      ) : null}
      {pending === 'retry' ? <PetWallSkeleton lines="card" className="w-full" /> : null}
      {cards.length > 0 ? (
        <div className="w-full">
          <PetWall cards={cards} photo={PetPhoto} prefetch={false} />
        </div>
      ) : null}
      {failure?.on === 'more' ? (
        <SaveFailedStrip attempt={state.request} message={texts.moreFailed[failure.reason]} />
      ) : null}
      <LoadMoreButton
        state={loadMoreState(cards.length, state.next !== null, hydrated)}
        href={profilePetsMoreHref(publicId, cards.length + LISTING_PAGE_SIZE, cards.length + 1)}
        loading={pending === 'more'}
        onLoadMore={() => void run('more', state.next)}
        texts={{ loadMore: texts.loadMore, cap: texts.cap }}
      />
    </section>
  )
}
