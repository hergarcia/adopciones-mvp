'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptIdentityConsent, submitIdentityRequest } from '@/actions/identity'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import type { IdentityOrigin } from '@/lib/verification/identity'
import { IdentityConsent, type IdentityConsentTexts } from './identity-consent'
import { IdentityPhotoField, type IdentityPhotoFieldTexts } from './identity-photo-field'
import { NotNowLink } from './not-now-link'
import { SelfieExample } from './selfie-example'

export type IdentityRequestFormTexts = {
  consent: IdentityConsentTexts
  front: IdentityPhotoFieldTexts
  selfie: IdentityPhotoFieldTexts
  selfieExample: string
  accept: string
  submit: string
  notNow: string
  /** Por clave de `identity.errors`. */
  errors: Record<string, string>
}

type Props = {
  texts: IdentityRequestFormTexts
  origin: IdentityOrigin
  hrefs: { notNow: string; phoneGate: string; signIn: string }
}

type Photos = { front: File | null; selfie: File | null }

// Los dos pasos en la misma pantalla: el consentimiento y, aceptado, las fotos (FR-003). Una sola
// tirita, la del paso: nombra lo que pasa después, no «Aceptar» a secas.
export function IdentityRequestForm({ texts, origin, hrefs }: Props) {
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

    startSending(async () => {
      const result = await submitIdentityRequest(form).catch(() => null)
      if (result?.ok) return router.refresh()
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

  return (
    <div className="mt-8 flex flex-col">
      <div className="max-w-[var(--measure)]">
        <IdentityConsent texts={texts.consent} accepted={accepted} />
      </div>

      {accepted ? (
        // Las dos fotos del mismo pedido son pares: desde 768 van lado a lado, con los huecos a la
        // misma altura aunque la selfie lleve el ejemplo arriba (cada campo es un subgrid).
        <div className="mt-8 flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-3">
          <IdentityPhotoField
            texts={texts.front}
            errors={texts.errors}
            name="front"
            capture="environment"
            onChange={setFront}
            onBusyChange={frontBusy}
            disabled={sending}
          />
          <IdentityPhotoField
            texts={texts.selfie}
            errors={texts.errors}
            name="selfie"
            capture="user"
            onChange={setSelfie}
            onBusyChange={selfieBusy}
            disabled={sending}
          >
            <SelfieExample description={texts.selfieExample} />
          </IdentityPhotoField>
        </div>
      ) : null}

      <div className="mt-10 flex max-w-[var(--measure)] flex-col gap-3">
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
      <NotNowLink href={hrefs.notNow} label={texts.notNow} />
    </div>
  )
}
