'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { RepublishLitterTexts } from './republish-litter-dialog'

type Props = {
  texts: RepublishLitterTexts
  onConfirm: (youngIds: string[]) => void
  close: () => void
}

// Lo de adentro de volver a publicar una camada adoptada (FR-006): se elige al menos una cría, y antes
// de confirmar se dice qué adopciones terminan. Lo elegido se olvida al cerrar.
export function RepublishLitterBody({ texts, onConfirm, close }: Props) {
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
    <>
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
            close()
            onConfirm(ids)
          }}
        >
          {texts.confirm}
        </Button>
        <Button variant="secondary" onClick={close}>
          {texts.cancel}
        </Button>
      </div>
    </>
  )
}
