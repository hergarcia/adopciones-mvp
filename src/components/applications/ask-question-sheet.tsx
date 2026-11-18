'use client'

import { useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { Button } from '@/components/ui/button'
import { deferredPart, type LaterPart } from '@/components/ui/deferred-part'
import { Sheet } from '@/components/ui/sheet'

export type AskQuestionTexts = {
  trigger: string
  title: string
  label: string
  /** «Te quedan 2 preguntas», ya con el número. */
  remaining: string
  contactLater: string
  confirm: string
  cancel: string
  close: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `inbox.errors`; los de contacto, crudos con `{fragment}`. */
  errors: Record<string, string>
  /** La espera del campo y los botones, y el aviso si no llegan. */
  part: LaterPart
}

type Props = {
  id: string
  /** Adónde va al enviarla: la misma solicitud con el aviso. */
  doneHref: string
  texts: AskQuestionTexts
}

// El campo y lo que pregunta llegan después de abrir (historias #304 y #316).
const AskQuestionBody = deferredPart(
  () => import('./ask-question-body').then((module) => module.AskQuestionBody),
  true,
)

// Pedir más información (FR-030): lo escrito queda acá, así sigue si se cierra la hoja y se vuelve a
// abrir; mientras corre, la hoja no se cierra.
export function AskQuestionSheet({ id, doneHref, texts }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (busy ? undefined : setOpen(next))}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="secondary" className="w-full md:w-auto">
          {texts.trigger}
        </Button>
      }
    >
      <AskQuestionBody
        part={texts.part}
        props={{
          id,
          doneHref,
          texts,
          text,
          onText: setText,
          busy,
          onBusy: setBusy,
          close: () => setOpen(false),
        }}
      />
    </Sheet>
  )
}
