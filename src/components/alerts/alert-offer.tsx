'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { createPetAlert } from '@/actions/pet-alerts'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { LinkButton } from '@/components/ui/link-button'
import { TextLink } from '@/components/ui/text-link'
import { MY_ALERTS_PATH, withAlertParam } from '@/lib/alerts/paths'
import type { AlertFilters, CreateAlertOutcome } from '@/lib/alerts/types'
import { signInWithNext } from '@/lib/auth/next-destination'
import { cn } from '@/lib/cn'
import { listingHref } from '@/lib/pets/listing-query'

export type AlertOfferTexts = {
  create: string
  created: string
  duplicate: string
  limit: string
  myAlerts: string
  deleteOne: string
  failed: string
}

export type OfferPlace = 'count' | 'empty' | 'empty-second'

const VARIANT = { count: 'ghost', empty: 'primary', 'empty-second': 'secondary' } as const

type Phase = 'idle' | 'creating' | 'failed' | 'sign-in' | CreateAlertOutcome

type Props = {
  filters: AlertFilters
  /** Si el listado no tenía resultados: lo único que mide además de cuántos filtros. */
  fromEmpty: boolean
  /** Sin sesión, «Avisame…» lleva a entrar y vuelve a este listado con la marca (research R8). */
  signedIn: boolean
  /** Volvió de entrar con la marca: crea una sola vez al montar, sin otro toque. */
  autoCreate: boolean
  /** Ya creó al montar: el listado no lo vuelve a pedir si se remonta con los mismos filtros. */
  onAutoCreate: () => void
  /**
   * Junto al total pesa poco; en el vacío con filtros es la acción, y en el vacío sin ninguno va
   * después de «Publicar un animal», que es lo único que llena la pared.
   */
  place: OfferPlace
  texts: AlertOfferTexts
}

// Cambiar los filtros lo remonta (su `key`), así vuelve a quieto.
export function AlertOffer({
  filters,
  fromEmpty,
  signedIn,
  autoCreate,
  onAutoCreate,
  place,
  texts,
}: Props) {
  const [phase, setPhase] = useState<Phase>(signedIn ? 'idle' : 'sign-in')
  const started = useRef(false)

  async function create() {
    setPhase('creating')
    const result = await createPetAlert({ filters, fromEmpty }).catch(() => null)
    if (result === null) return setPhase('failed')
    if (result.ok) return setPhase(result.data)
    setPhase(result.error === 'alerts.errors.session' ? 'sign-in' : 'failed')
  }

  // La marca `avisar` sale sola de la dirección: `useListing` la reescribe con la canónica.
  const createOnReturn = useEffectEvent(() => {
    if (!autoCreate || !signedIn || started.current) return
    started.current = true
    onAutoCreate()
    void create()
  })
  useEffect(() => createOnReturn(), [])

  if (phase === 'created' || phase === 'duplicate' || phase === 'limit') {
    const [said, link] =
      phase === 'limit' ? [texts.limit, texts.deleteOne] : [texts[phase], texts.myAlerts]
    return (
      <output className="block animate-[fade-in_var(--dur-base)_var(--ease-out)] text-sm text-ink">
        {said}{' '}
        <TextLink href={MY_ALERTS_PATH} placement="inline">
          {link}
        </TextLink>
      </output>
    )
  }

  const variant = VARIANT[place]
  const size = place === 'count' ? 'sm' : 'md'
  if (phase === 'sign-in') {
    return (
      <LinkButton
        href={signInWithNext(withAlertParam(listingHref(filters)))}
        variant={variant}
        size={size}
        prefetch={false}
      >
        {texts.create}
      </LinkButton>
    )
  }
  return (
    <div className={cn('flex flex-col gap-2', place === 'count' ? 'items-start' : 'items-center')}>
      <Button
        variant={variant}
        size={size}
        loading={phase === 'creating'}
        onClick={() => void create()}
      >
        {texts.create}
      </Button>
      {phase === 'failed' ? <ErrorText announce>{texts.failed}</ErrorText> : null}
    </div>
  )
}
