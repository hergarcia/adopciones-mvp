'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { trackShare } from '@/actions/share'
import { Button } from '@/components/ui/button'
import { Toast, ToastProvider } from '@/components/ui/toast'
import { shareUrl } from '@/lib/pets/share-url'
import { readShareDevice } from '@/lib/share/device'
import { shareGate, shareLink } from '@/lib/share/share-mode'
import type { ShareButtonProps } from './share-button'
import { ShareManualSheet } from './share-manual-sheet'

// «Compartir» vivo (FR-013, research R8 de #57): la decisión y el freno a un segundo toque viven en
// `lib/share/share-mode.ts`, con su test; esta hoja los conecta con el navegador. Llega después de
// abrir con todo lo que necesita —el aviso y copiar a mano—, así anda aunque la señal se corte
// (historia #95, research R3).
export function ShareButtonLive(props: ShareButtonProps) {
  const { code, from, texts, variant = 'secondary', size = 'md' } = props
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
      {/* La región de avisos, fuera del renglón de acciones: adentro sumaría un hueco al aparecer. */}
      {props.region === 'own'
        ? createPortal(
            <ToastProvider label={props.toast.label} regionLabel={props.toast.region}>
              {toast}
            </ToastProvider>,
            document.body,
          )
        : toast}
      {notice === 'manual' ? (
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
      ) : null}
    </>
  )
}
