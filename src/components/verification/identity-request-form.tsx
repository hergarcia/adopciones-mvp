'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptIdentityConsent, submitIdentityRequest } from '@/actions/identity'
import { SingleTaskColumns } from '@/components/forms/single-task-columns'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { cn } from '@/lib/cn'
import type { NotNowTarget } from '@/lib/verification/exit-question'
import type { IdentityOrigin } from '@/lib/verification/identity'
import { IdentityConsent, type IdentityConsentTexts } from './identity-consent'
import { IdentityPhotoField, type IdentityPhotoFieldTexts } from './identity-photo-field'
import { NotNow } from './not-now'

export type IdentityRequestFormTexts = {
  consent: IdentityConsentTexts
  front: IdentityPhotoFieldTexts
  selfie: IdentityPhotoFieldTexts
  accept: string
  submit: string
  notNow: string
  /** Por clave de `identity.errors`. */
  errors: Record<string, string>
}

type Props = {
  /** El título y la bajada, arriba de lo que se pide. */
  header: React.ReactNode
  texts: IdentityRequestFormTexts
  origin: IdentityOrigin
  /** El animal desde el que se pidió: el correo de aprobada lleva de vuelta a él (#63, R10). */
  returnCode?: string | null
  /** `sent`: adónde va después de mandarlo; sin él, la misma pantalla muestra el estado. */
  hrefs: { phoneGate: string; signIn: string; sent?: string }
  notNow: NotNowTarget
}

type Photos = { front: File | null; selfie: File | null }

// Los dos pasos en la misma pantalla: el consentimiento y, aceptado, las fotos (FR-003). Una sola
// tirita, la del paso: nombra lo que pasa después, no «Aceptar» a secas.
export function IdentityRequestForm({
  header,
  texts,
  origin,
  returnCode = null,
  hrefs,
  notNow,
}: Props) {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [photos, setPhotos] = useState<Photos>({ front: null, selfie: null })
  const [busy, setBusy] = useState({ front: false, selfie: false })
  const [error, setError] = useState<string | null>(null)
  const [sending, startSending] = useTransition()

  const setFront = useCallback((file: File | null) => setPhotos((p) => ({ ...p, front: file })), [])
  const setSelfie = useCallback(
    (file: File | null) => setPhotos((p) => ({ ...p, selfie: file })),
    [],
  )
  const frontBusy = useCallback((value: boolean) => setBusy((b) => ({ ...b, front: value })), [])
  const selfieBusy = useCallback((value: boolean) => setBusy((b) => ({ ...b, selfie: value })), [])

  function accept() {
    setAccepted(true)
    void acceptIdentityConsent(origin)
  }

  function send() {
    const { front, selfie } = photos
    if (front === null || selfie === null) return
    setError(null)
    const form = new FormData()
    form.set('consent', 'yes')
    form.set('origin', origin)
    form.set('front', front)
    form.set('selfie', selfie)
    if (returnCode !== null) form.set('returnCode', returnCode)

    startSending(async () => {
      const result = await submitIdentityRequest(form).catch(() => null)
      if (result?.ok) return hrefs.sent === undefined ? router.refresh() : router.push(hrefs.sent)
      const key = result?.error ?? 'identity.errors.send_failed'
      if (key === 'identity.errors.no_phone') return router.push(hrefs.phoneGate)
      // Sin sesión se pide ingresar; las fotos no se conservan en ningún lado (Edge Cases).
      if (key === 'identity.errors.session') return router.push(hrefs.signIn)
      // Ya había uno abierto o llegó al tope en otra pestaña: la pantalla pasa a mostrar el estado.
      if (key === 'identity.errors.already_open' || key === 'identity.errors.capped') {
        return router.refresh()
      }
      setError(texts.errors[key] ?? texts.errors['identity.errors.send_failed'] ?? null)
    })
  }

  const ready = photos.front !== null && photos.selfie !== null && !busy.front && !busy.selfie

  // Lo que se pide y lo que se hace con las fotos es la presentación: desde 1024 queda quieto a la
  // izquierda mientras se eligen las fotos a la derecha, una debajo de la otra.
  return (
    <SingleTaskColumns
      presentation={
        <div className="max-w-[var(--measure)] lg:max-w-none">
          {header}
          <div className="mt-8">
            <IdentityConsent texts={texts.consent} accepted={accepted} />
          </div>
        </div>
      }
      task={
        <div className={cn('flex flex-col', accepted ? 'mt-8' : 'mt-10')}>
          {accepted ? (
            // Las dos fotos del mismo pedido son pares: de 768 a 1024 van lado a lado, cada una con
            // cómo sacarla arriba y los huecos a la misma altura (cada campo es un subgrid).
            <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-3 lg:flex lg:gap-10">
              <IdentityPhotoField
                texts={texts.front}
                errors={texts.errors}
                kind="front"
                capture="environment"
                onChange={setFront}
                onBusyChange={frontBusy}
                disabled={sending}
              />
              <IdentityPhotoField
                texts={texts.selfie}
                errors={texts.errors}
                kind="selfie"
                capture="user"
                onChange={setSelfie}
                onBusyChange={selfieBusy}
                disabled={sending}
              />
            </div>
          ) : null}

          <div
            className={cn(
              'flex max-w-[var(--measure)] flex-col gap-3 lg:max-w-none',
              accepted && 'mt-10',
            )}
          >
            {error ? <ErrorText announce>{error}</ErrorText> : null}
            {accepted ? (
              <Button variant="tirita" size="lg" onClick={send} disabled={!ready} loading={sending}>
                {texts.submit}
              </Button>
            ) : (
              <Button variant="tirita" size="lg" onClick={accept}>
                {texts.accept}
              </Button>
            )}
          </div>
          <NotNow level="identity" target={notNow} label={texts.notNow} />
        </div>
      }
    />
  )
}
