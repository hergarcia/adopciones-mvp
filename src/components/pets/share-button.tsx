'use client'

import { Suspense, lazy, useEffect, useState } from 'react'
import { trackShare } from '@/actions/share'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import type { ShareOrigin } from '@/lib/analytics/events'
import { cn } from '@/lib/cn'
import { shareUrl } from '@/lib/pets/share-url'
import { readShareDevice } from '@/lib/share/device'
import { shareGate, shareLink } from '@/lib/share/share-mode'

const ShareManualSheet = lazy(async () => ({
  default: (await import('./share-manual-sheet')).ShareManualSheet,
}))

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

// «Compartir» (FR-013, research R8): la decisión y el freno a un segundo toque viven en
// `lib/share/share-mode.ts`, con su test; esta hoja los conecta con el navegador. Sale del servidor
// invisible, ocupando su lugar, y se revela al hidratar: sin ejecutar nada no aparece, y al
// aparecer no mueve nada. El `ToastProvider` lo pone la página.
export function ShareButton({ code, from, texts, variant = 'secondary', size = 'md' }: Props) {
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<'none' | 'copied' | 'manual'>('none')
  const url = shareUrl(code)
  // Uno por botón y para siempre: el freno tiene que sobrevivir a los renders.
  const [gate] = useState(() =>
    shareGate(() =>
      shareLink({
        device: readShareDevice(),
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
    const outcome = await gate.tap()
    if (outcome === null) return
    void trackShare(from)
    if (outcome === 'copied' || outcome === 'manual') setNotice(outcome)
  }

  function close(open: boolean) {
    if (open) return
    setNotice('none')
    gate.release()
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
      {notice === 'manual' ? (
        <Suspense>
          <ShareManualSheet
            url={url}
            onClose={() => close(false)}
            texts={{
              title: texts.manualTitle,
              body: texts.manualBody,
              linkLabel: texts.linkLabel,
              close: texts.close,
            }}
          />
        </Suspense>
      ) : null}
    </>
  )
}
