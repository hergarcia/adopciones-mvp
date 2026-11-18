'use client'

import { useRouter } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { confirmPhoneCode } from '@/actions/phone'
import { NUMBER_WITHHELD, type ConfirmResult } from '@/lib/verification/code-check'
import { codeToAutoCheck, stripCodeSeparators } from '@/lib/verification/code-input'

type Refused = Exclude<ConfirmResult, { ok: true }>

type Options = {
  /** La puerta tal como llegó en la URL; la acción la vuelve a validar. */
  gate: { para?: string; next?: string; desde?: string }
  hrefs: { inUse: string; withheld: string; signIn: string }
  onStart: () => void
  onRefused: (result: Refused) => void
}

const SESSION = 'verification.errors.session'
const CHECK_FAILED = 'verification.errors.check_failed'
const IN_USE = 'verification.errors.number_in_use'

// Una revisión por vez, salga del botón o del renglón completo. Refs y no estado: el sexto número
// y un toque a «Verificar» pueden llegar en el mismo render, y los dos tienen que ver que ya salió.
export function usePhoneCodeCheck({ gate, hrefs, onStart, onRefused }: Options) {
  const router = useRouter()
  const [verifying, startVerifying] = useTransition()
  const checking = useRef(false)
  const lastChecked = useRef<string | null>(null)

  function check(value: string) {
    if (checking.current) return
    checking.current = true
    lastChecked.current = stripCodeSeparators(value)
    onStart()

    startVerifying(async () => {
      try {
        const result = await confirmPhoneCode(value, gate)
        if (result.ok) {
          router.replace(result.data.destination)
          return
        }
        checking.current = false
        if (result.error === SESSION) {
          router.push(hrefs.signIn)
          return
        }
        // Ya no hay nada a medias: los caminos viven en su propia ruta, a la que la confirmación
        // puede volver (FR-006 de la #25).
        if (result.error === IN_USE) {
          router.replace(hrefs.inUse)
          return
        }
        if (result.error === NUMBER_WITHHELD) {
          router.replace(hrefs.withheld)
          return
        }
        onRefused(result)
      } catch {
        checking.current = false
        // La red, no el código: no cuenta como intento y lo escrito queda (FR-007c).
        onRefused({ ok: false, error: CHECK_FAILED, detail: { clearInput: false } })
      }
    })
  }

  return {
    verifying,
    check,
    /** El renglón cambió: completo y con un código que todavía no salió, se revisa solo. */
    changed: (value: string) => {
      if (codeToAutoCheck(value, lastChecked.current) !== null) check(value)
    },
    /** Llegó otro código: lo que ya se revisó no frena al nuevo. */
    forget: () => {
      lastChecked.current = null
    },
  }
}
