'use client'

import { useMemo, useState } from 'react'
import { trackShare } from '@/actions/share'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { readShareDevice } from '@/lib/share/device'
import { copyText, shareGate } from '@/lib/share/share-mode'
import type { GroupPostButtonProps } from './group-post-button'
import { PlacedToast } from './placed-toast'
import { ShareManualSheet } from './share-manual-sheet'

// Siempre copia, también en el teléfono: el texto se pega en el grupo o en el chat, y las opciones
// de compartir mandarían solo el enlace. El freno a un segundo toque es el de «Compartir».
export function GroupPostButtonLive(props: GroupPostButtonProps) {
  const { from, texts, size = 'md' } = props
  const [notice, setNotice] = useState<'none' | 'copied' | 'manual'>('none')
  // El texto cambia si el animal pasa a «en proceso» con la pantalla abierta.
  const gate = useMemo(
    () =>
      shareGate(() =>
        copyText({
          canCopy: readShareDevice().canCopy,
          text: texts.text,
          copy: (value) => navigator.clipboard.writeText(value),
        }),
      ),
    [texts.text],
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

  return (
    <>
      <Button variant="ghost" size={size} onClick={() => void onClick()}>
        {texts.action}
      </Button>
      <PlacedToast placement={props}>
        <Toast
          message={texts.copied}
          closeLabel={texts.close}
          variant="success"
          open={notice === 'copied'}
          onOpenChange={close}
        />
      </PlacedToast>
      {notice === 'manual' ? (
        <ShareManualSheet
          value={texts.text}
          multiline
          onClose={() => close(false)}
          texts={{
            title: texts.manualTitle,
            body: texts.manualBody,
            fieldLabel: texts.textLabel,
            close: texts.close,
          }}
        />
      ) : null}
    </>
  )
}
