'use client'

import { useState } from 'react'
import { trackShare } from '@/actions/share'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { petPath } from '@/lib/pets/paths'
import { shareUrl } from '@/lib/pets/share-url'
import { readShareDevice } from '@/lib/share/device'
import { shareGate, shareLink } from '@/lib/share/share-mode'
import type { ShareButtonProps } from './share-button'
import { ShareManualSheet } from './share-manual-sheet'
import { PlacedToast } from './placed-toast'

// «Compartir» vivo (FR-013, research R8 de #57): la decisión y el freno a un segundo toque viven en
// `lib/share/share-mode.ts`, con su test; esta hoja los conecta con el navegador. Llega después de
// abrir con todo lo que necesita —el aviso y copiar a mano—, así anda aunque la señal se corte
// (historia #95, research R3).
export function ShareButtonLive(props: ShareButtonProps) {
  const { code, from, texts, variant = 'secondary', size = 'md' } = props
  const [notice, setNotice] = useState<'none' | 'copied' | 'manual'>('none')
  const url = shareUrl(props.path ?? petPath(code))
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

  const toast = (
    <Toast
      message={texts.copied}
      closeLabel={texts.close}
      variant="success"
      open={notice === 'copied'}
      onOpenChange={close}
    />
  )

  return (
    <>
      <Button variant={variant} size={size} onClick={() => void onClick()}>
        {texts.action}
      </Button>
      <PlacedToast placement={props}>{toast}</PlacedToast>
      {notice === 'manual' ? (
        <ShareManualSheet
          value={url}
          onClose={() => close(false)}
          texts={{
            title: texts.manualTitle,
            body: texts.manualBody,
            fieldLabel: texts.linkLabel,
            close: texts.close,
          }}
        />
      ) : null}
    </>
  )
}
