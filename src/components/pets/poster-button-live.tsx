'use client'

import { useState } from 'react'
import { trackShare } from '@/actions/share'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { countsAsShare, savePoster } from '@/lib/share/poster'
import { PlacedToast } from './placed-toast'
import type { PosterButtonProps } from './poster-button'

async function loadPoster(image: string, fileName: string): Promise<File | null> {
  const response = await fetch(image, { cache: 'no-store' })
  if (!response.ok) return null
  const blob = await response.blob()
  return new File([blob], fileName, { type: blob.type })
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  // Safari todavía lee la dirección después del click: soltarla en el momento cortaba la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// Mientras la imagen se arma el botón trabaja y no vuelve a disparar. Qué hace con ella y qué se
// cuenta lo decide `lib/share/poster.ts`, con su test.
export function PosterButtonLive(props: PosterButtonProps) {
  const { texts, target } = props
  const [isWorking, setIsWorking] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  async function onClick() {
    setIsWorking(true)
    setHasFailed(false)
    const outcome = await savePoster({
      coarse: window.matchMedia('(pointer: coarse)').matches,
      load: () => loadPoster(target.image, target.fileName),
      canShare: (data) => typeof navigator.canShare === 'function' && navigator.canShare(data),
      share: (data) => navigator.share(data),
      download,
      title: texts.title,
      link: target.link,
    })
    setIsWorking(false)
    if (countsAsShare(outcome)) void trackShare('pet_poster')
    if (outcome === 'failed') setHasFailed(true)
  }

  return (
    <>
      <Button variant="ghost" loading={isWorking} onClick={() => void onClick()}>
        {texts.action}
      </Button>
      <PlacedToast placement={props}>
        <Toast
          message={texts.failed}
          closeLabel={texts.close}
          variant="error"
          open={hasFailed}
          onOpenChange={setHasFailed}
        />
      </PlacedToast>
    </>
  )
}
