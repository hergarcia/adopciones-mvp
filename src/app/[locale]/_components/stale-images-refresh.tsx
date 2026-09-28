'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { isStale } from '@/lib/pets/listing-state'

// Las firmas de las fotos vencen a la hora (FR-018): una ficha que vuelve de la caché del router, o
// una pestaña que la persona retoma desde WhatsApp, pide la página de nuevo antes de que venzan.
// Sin dibujo.
export function StaleImagesRefresh({ signedAt }: { signedAt: string }) {
  const router = useRouter()

  useEffect(() => {
    const refreshIfStale = () => {
      if (document.visibilityState === 'visible' && isStale(signedAt, new Date())) router.refresh()
    }
    refreshIfStale()
    document.addEventListener('visibilitychange', refreshIfStale)
    window.addEventListener('pageshow', refreshIfStale)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale)
      window.removeEventListener('pageshow', refreshIfStale)
    }
  }, [router, signedAt])

  return null
}
