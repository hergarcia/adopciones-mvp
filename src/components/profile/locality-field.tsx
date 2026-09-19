'use client'

/* eslint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role --
   Este es el patrón de combobox de WAI-ARIA 1.2, que es exactamente un input con role combobox y
   una lista propia de ul/li. El linter sugiere `select` y `option`, que restringen el valor a la
   lista; acá la localidad tiene que poder escribirse libre porque la sugerencia es una ayuda, no
   una restricción (FR-019), y `datalist` no se puede estilar ni puede cumplir el estado «ninguna
   coincide» (FR-019a). */

import { useId, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { matchLocalities } from '@/lib/zones/match'

export type LocalityTexts = {
  label: string
  placeholder: string
  hint: string
  /** Cuántas coincidencias hay, para quien no ve la lista. Tres textos y no uno con plural de
   *  ICU: la cantidad se conoce recién en el navegador, y acá no hay quien formatee ICU. */
  suggestionsNone: string
  suggestionsOne: string
  /** Con `{count}` adentro. */
  suggestionsMany: string
}

type Props = {
  texts: LocalityTexts
  localities: readonly string[]
  value: string
  onChange: (value: string) => void
  error?: string
}

// Un combobox de verdad, no una caja con una lista debajo: sin `aria-activedescendant` ni las
// flechas, quien navega con teclado o con lector de pantalla no puede elegir una sugerencia.
//
// No es una primitiva de `ui/`: tiene un solo uso, y `docs/08` §Principio rector prohíbe abstraer
// por las dudas. Si aparece un segundo uso, se muda con su fila en `docs/10`.
function announce(count: number, texts: LocalityTexts): string {
  if (count === 0) return texts.suggestionsNone
  if (count === 1) return texts.suggestionsOne
  return texts.suggestionsMany.replace('{count}', String(count))
}

export function LocalityField({ texts, localities, value, onChange, error }: Props) {
  const listId = useId()
  const optionId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const matches = matchLocalities(localities, value)
  const showList = open && matches.length > 0

  function choose(locality: string) {
    onChange(locality)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!showList) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (current + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => (current <= 0 ? matches.length - 1 : current - 1))
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      choose(matches[active])
    } else if (event.key === 'Escape') {
      // Cierra la lista sin tocar lo escrito: lo que tipeó vale igual (FR-019).
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.label}</span>
        <Input
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${optionId}-${active}` : undefined}
          autoComplete="off"
          placeholder={texts.placeholder}
          value={value}
          error={error}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Con retraso: sin esto, el blur cierra la lista antes de que el click elija.
            blurTimer.current = setTimeout(() => setOpen(false), 120)
          }}
          onKeyDown={onKeyDown}
        />
      </label>

      <p className="text-sm text-ink-muted">{texts.hint}</p>
      {/* Solo mientras la lista está abierta: si no, se anunciaría en cada tecla y también con la
          lista cerrada, que es ruido para quien usa un lector de pantalla. */}
      <p aria-live="polite" className="sr-only">
        {open ? announce(matches.length, texts) : ''}
      </p>

      {showList ? (
        <ul id={listId} role="listbox" className="border-2 border-ink bg-canvas">
          {matches.map((locality, index) => (
            <li
              key={locality}
              id={`${optionId}-${index}`}
              role="option"
              aria-selected={index === active}
              className={cn(
                'cursor-pointer px-3 py-2 text-base text-ink transition-colors duration-[var(--dur-fast)] ease-out hover:bg-surface',
                index === active && 'bg-surface',
              )}
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current)
                choose(locality)
              }}
            >
              {locality}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
