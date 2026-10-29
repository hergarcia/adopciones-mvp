'use client'

import { useRef, useState } from 'react'
import { AlertOffer, type AlertOfferTexts, type OfferPlace } from '@/components/alerts/alert-offer'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { ListingCount } from '@/components/pets/listing-count'
import { PetPhoto } from '@/components/pets/pet-photo'
import { ListingFilters, type FilterTexts } from '@/components/pets/listing-filters'
import { LoadMoreButton } from '@/components/pets/load-more-button'
import { PetWall } from '@/components/pets/pet-wall'
import { Button } from '@/components/ui/button'
import { useListing } from '@/hooks/use-listing'
import { cn } from '@/lib/cn'
import { loadMoreState } from '@/lib/pets/listing-page'
import {
  hasFilters,
  listingHref,
  listingSearch,
  type ListingFilters as Filters,
} from '@/lib/pets/listing-query'
import type { ListingFailure } from '@/lib/pets/listing-requests'
import { canLoadMore, type ListingView } from '@/lib/pets/listing-state'
import { LISTING_PAGE_SIZE } from '@/lib/pets/rules'
import { ListingEmpty } from './listing-empty'
import { readSnapshot, writeSnapshot } from './listing-snapshot'

export type ListingTexts = {
  filters: FilterTexts
  offer: AlertOfferTexts
  loadMore: string
  cap: string
  retry: string
  empty: string
  emptyAction: string
  emptyFiltered: string
  loadError: string
  /** La frase entera de cada falla, con lo que queda a la vista o qué hacer (docs/06). */
  filterFailed: Record<ListingFailure, string>
  moreFailed: Record<ListingFailure, string>
}

type Props = {
  filters: Filters
  view: ListingView
  /** La base no respondió al abrir: los filtros quedan a la vista, con el aviso y «Reintentar». */
  failed: boolean
  /** Con sesión, «Avisame…» crea; sin ella, lleva a entrar (historia #265). */
  signedIn: boolean
  /** Volvió de entrar con la marca `avisar`: el aviso de estos filtros se crea al llegar. */
  autoCreate: boolean
  texts: ListingTexts
}

const STORAGE = { read: readSnapshot, write: writeSnapshot }

// La hoja cliente del listado (research R4): dibuja el total, los filtros, la pared, los vacíos, las
// fallas y «Ver más» a partir del estado de `useListing`. Sin ejecutar nada, el servidor la dibuja
// igual y el formulario y «Ver más» son un GET y un enlace (FR-019).
export function ListingController({ filters, view, failed, signedIn, autoCreate, texts }: Props) {
  const form = useRef<HTMLFormElement>(null)
  const listing = useListing(
    {
      ...view,
      filters,
      pending: 'none',
      request: 0,
      failure: failed ? { on: 'open', reason: 'no_response' } : null,
    },
    STORAGE,
    form,
  )
  const { state, hydrated } = listing
  const { cards, failure, pending } = state
  const [autoPending, setAutoPending] = useState(autoCreate)
  // Una por filtros: al cambiarlos vuelve a ofrecer, y solo los de la vuelta crean solos.
  const offer = (place: OfferPlace) => (
    <AlertOffer
      key={listingSearch(state.filters)}
      filters={state.filters}
      fromEmpty={cards.length === 0}
      signedIn={signedIn}
      autoCreate={autoPending && listingSearch(state.filters) === listingSearch(filters)}
      onAutoCreate={() => setAutoPending(false)}
      place={place}
      texts={texts.offer}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      {failure?.on === 'open' ? null : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <ListingCount text={state.totalText} />
          {cards.length > 0 ? offer('count') : null}
        </div>
      )}
      <div className="flex flex-col gap-8">
        <ListingFilters
          ref={form}
          filters={state.filters}
          texts={texts.filters}
          hydrated={hydrated}
          offerClear={cards.length > 0 || failure?.on === 'open'}
          onChange={listing.onFormChange}
          onClear={listing.clear}
        />
        <div className="flex min-w-0 flex-col items-start gap-6">
          {failure !== null && failure.on !== 'more' ? (
            <div className="flex w-full flex-col items-start gap-3">
              <SaveFailedStrip
                attempt={state.request}
                message={
                  failure.on === 'open' ? texts.loadError : texts.filterFailed[failure.reason]
                }
              />
              <Button variant="secondary" loading={pending === 'filter'} onClick={listing.retry}>
                {texts.retry}
              </Button>
            </div>
          ) : null}
          {/* Al cambiar un filtro, lo de antes queda hasta que llega lo nuevo, apagado y quieto. */}
          <div
            aria-busy={pending === 'filter' || undefined}
            className={cn(
              'w-full transition-opacity duration-[var(--dur-base)]',
              pending === 'filter' && 'opacity-60',
            )}
          >
            {cards.length > 0 ? (
              <PetWall
                cards={cards}
                photo={PetPhoto}
                prefetch={false}
                onCardOpen={listing.remember}
              />
            ) : failure?.on === 'open' ? null : (
              <ListingEmpty
                filtered={hasFilters(state.filters)}
                hydrated={hydrated}
                onClear={listing.clear}
                offer={offer(hasFilters(state.filters) ? 'empty' : 'empty-second')}
                texts={texts}
              />
            )}
          </div>
          {failure?.on === 'more' ? (
            <SaveFailedStrip attempt={state.request} message={texts.moreFailed[failure.reason]} />
          ) : null}
          <LoadMoreButton
            state={loadMoreState(cards.length, canLoadMore(state), hydrated)}
            href={`${listingHref(state.filters, cards.length + LISTING_PAGE_SIZE)}#a-${cards.length + 1}`}
            loading={pending === 'more'}
            onLoadMore={listing.loadMore}
            texts={{ loadMore: texts.loadMore, cap: texts.cap }}
          />
        </div>
      </div>
    </div>
  )
}
