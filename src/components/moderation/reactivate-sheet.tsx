'use client'

import { useState } from 'react'
import { useAnnounce } from '@/components/forms/announce-notices'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Sheet } from '@/components/ui/sheet'
import {
  useReactivate,
  type ReactivateFailure,
  type ReactivateSettled,
} from '@/hooks/use-reactivate'

export type ReactivateSheetTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  cancel: string
  close: string
  /** Ya con el nombre: «Ana puede volver a usar el sitio». */
  done: string
  failures: Record<ReactivateFailure, string>
  /** Con `{name}` adentro, que se reemplaza por quién la reactivó. */
  already: string
  alreadyDeleted: string
  gone: string
}

type Props = {
  suspensionId: string
  texts: ReactivateSheetTexts
}

function settledText(settled: ReactivateSettled, texts: ReactivateSheetTexts): string {
  if (settled.kind === 'gone') return texts.gone
  const by = settled.detail?.by ?? null
  return by === null ? texts.alreadyDeleted : texts.already.replace('{name}', by)
}

// Reactivar se deshace suspendiendo de nuevo, así que confirma en una `Sheet` y no en un `Dialog`
// (docs/10, como `VouchSheet`). Quieto · haciendo · error, con el error adentro y reintentar en el
// mismo botón. Al salir bien, la fila sale de la lista con su aviso.
export function ReactivateSheet({ suspensionId, texts }: Props) {
  const announce = useAnnounce()
  const [open, setOpen] = useState(false)
  const flow = useReactivate({ suspensionId, onDone: () => announce(texts.done) })

  if (flow.settled !== null) {
    return <p className="text-base text-ink-muted">{settledText(flow.settled, texts)}</p>
  }

  async function confirm() {
    if (await flow.reactivate()) setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (flow.busy ? undefined : setOpen(next))}
      title={texts.title}
      closeLabel={texts.close}
      trigger={<Button variant="secondary">{texts.trigger}</Button>}
    >
      <p className="text-base text-ink">{texts.body}</p>
      {flow.failure === null ? null : (
        <div className="mt-3 w-full">
          <ErrorText announce>{texts.failures[flow.failure.kind]}</ErrorText>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button variant="secondary" loading={flow.busy} onClick={() => void confirm()}>
          {texts.confirm}
        </Button>
        <Button variant="ghost" disabled={flow.busy} onClick={() => setOpen(false)}>
          {texts.cancel}
        </Button>
      </div>
    </Sheet>
  )
}
