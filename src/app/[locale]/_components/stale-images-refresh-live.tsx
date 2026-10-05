'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { useOnResume } from '@/hooks/use-on-resume'
import { isStale } from '@/lib/pets/listing-state'

// Las firmas de las fotos vencen a la hora (FR-018): una ficha que vuelve de la caché del router, o
// una pestaña que la persona retoma desde WhatsApp, pide la página de nuevo antes de que venzan.
// Sin dibujo.
export function StaleImagesRefreshLive({ signedAt }: { signedAt: string }) {
  const router = useRouter()
  const refreshIfStale = useCallback(() => {
    if (isStale(signedAt, new Date())) router.refresh()
  }, [router, signedAt])

  useEffect(refreshIfStale, [refreshIfStale])
  useOnResume(refreshIfStale)

  return null
}
