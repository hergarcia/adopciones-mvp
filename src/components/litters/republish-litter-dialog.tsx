'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog } from '@/components/ui/dialog'

export type RepublishLitterTexts = {
  title: string
  /** «Elegí al menos una»: también por qué el botón está apagado. */
  help: string
  confirm: string
  cancel: string
  close: string
  /** Cada cría adoptada: a quién se dio y, si fue a una persona, que esa adopción termina (#67). */
  young: { id: string; name: string; detail: string | null; ends: string | null }[]
}

type Props = {
  /** El botón «Volver a publicar», con el aspecto que le toca en la card o en la pantalla. */
  trigger: React.ComponentProps<typeof Button> & { label: string }
  texts: RepublishLitterTexts
  /** Corre «Volver a publicar» con las crías elegidas, en el flujo de siempre (research R11). */
  onConfirm: (youngIds: string[]) => void
}

// Volver a publicar una camada adoptada (FR-006): se elige al menos una cría, y antes de confirmar se
// dice qué adopciones terminan. Las que no se eligen siguen adoptadas. Cancelar no cambia nada; lo
// que no llegó lo dice el flujo de las acciones, como cualquier otro cambio de estado.
export function RepublishLitterDialog({ trigger: { label, ...button }, texts, onConfirm }: Props) {
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set())
  const ending = texts.young.filter((one) => chosen.has(one.id) && one.ends !== null)

  function toggle(id: string, on: boolean) {
    setChosen((previous) => {
      const next = new Set(previous)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setChosen(new Set())
      }}
      title={texts.title}
      closeLabel={texts.close}
      trigger={<Button {...button}>{label}</Button>}
    >
      <p className="text-sm text-ink-muted">{texts.help}</p>
      <ul className="mt-4 flex flex-col gap-1">
        {texts.young.map((one) => (
          <li key={one.id}>
            <Checkbox
              checked={chosen.has(one.id)}
              onChange={(event) => toggle(one.id, event.currentTarget.checked)}
              label={
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-bold">{one.name}</span>
                  {one.detail === null ? null : (
                    <span className="text-sm text-ink-muted">{one.detail}</span>
                  )}
                </span>
              }
            />
          </li>
        ))}
      </ul>
      {ending.length === 0 ? null : (
        <div aria-live="polite" className="mt-4 flex flex-col gap-1">
          {ending.map((one) => (
            <p key={one.id} className="text-sm font-bold text-warning">
              {one.ends}
            </p>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button
          variant="primary"
          disabled={chosen.size === 0}
          onClick={() => {
            const ids = texts.young.flatMap((one) => (chosen.has(one.id) ? [one.id] : []))
            setOpen(false)
            setChosen(new Set())
            onConfirm(ids)
          }}
        >
          {texts.confirm}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {texts.cancel}
        </Button>
      </div>
    </Dialog>
  )
}
