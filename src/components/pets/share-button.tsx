'use client'

import { useEffect, useRef, useState } from 'react'
import { trackShare } from '@/actions/share'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { Toast } from '@/components/ui/toast'
import type { ShareOrigin } from '@/lib/analytics/events'
import { cn } from '@/lib/cn'
import { shareGate, shareLink, shareUrl } from '@/lib/pets/share-mode'

export type ShareTexts = {
  action: string
  /** «Luna en adopción»: el título de lo que se comparte. */
  title: string
  copied: string
  manualTitle: string
  manualBody: string
  linkLabel: string
  close: string
}

type Props = {
  code: string
  from: ShareOrigin
  texts: ShareTexts
  variant?: 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

function device() {
  return {
    coarse: window.matchMedia('(pointer: coarse)').matches,
    canShare: typeof navigator.share === 'function',
    canCopy: typeof navigator.clipboard?.writeText === 'function',
  }
}

// «Compartir» (FR-013, research R8): la decisión y el freno a un segundo toque viven en
// `lib/pets/share-mode.ts`, con su test; esta hoja los conecta con el navegador. Sale del servidor
// invisible, ocupando su lugar, y se revela al hidratar: sin ejecutar nada no aparece, y al
// aparecer no mueve nada. El `ToastProvider` lo pone la página. En el `Sheet`, Radix pone el foco en el
// enlace, que es lo primero que se puede tocar, y al enfocarlo queda seleccionado.
export function ShareButton({ code, from, texts, variant = 'secondary', size = 'md' }: Props) {
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<'none' | 'copied' | 'manual'>('none')
  const url = shareUrl(code)
  const gate = useRef(
    shareGate(() =>
      shareLink({
        device: device(),
        url,
        title: texts.title,
        share: (data) => navigator.share(data),
        copy: (text) => navigator.clipboard.writeText(text),
      }),
    ),
  )

  /* eslint-disable react/set-state-in-effect */
  useEffect(() => setReady(true), [])
  /* eslint-enable react/set-state-in-effect */

  async function onClick() {
    const outcome = await gate.current.tap()
    if (outcome === null) return
    void trackShare(from)
    if (outcome === 'copied' || outcome === 'manual') setNotice(outcome)
  }

  function close(open: boolean) {
    if (open) return
    setNotice('none')
    gate.current.release()
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => void onClick()}
        aria-hidden={!ready || undefined}
        tabIndex={ready ? undefined : -1}
        className={cn(!ready && 'invisible')}
      >
        {texts.action}
      </Button>
      <Toast
        message={texts.copied}
        closeLabel={texts.close}
        variant="success"
        open={notice === 'copied'}
        onOpenChange={close}
      />
      <Sheet
        title={texts.manualTitle}
        closeLabel={texts.close}
        open={notice === 'manual'}
        onOpenChange={close}
      >
        <p className="text-base text-ink">{texts.manualBody}</p>
        <Input
          readOnly
          value={url}
          aria-label={texts.linkLabel}
          onFocus={(event) => event.currentTarget.select()}
          className="w-full"
        />
      </Sheet>
    </>
  )
}
