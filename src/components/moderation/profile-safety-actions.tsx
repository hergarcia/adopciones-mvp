'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { signInWithNext } from '@/lib/auth/next-destination'
import { REPORT_FLAG, withFlag } from '@/lib/moderation/paths'
import type { SafetyActions } from '@/lib/moderation/safety-actions'
import type { ReportSheetTexts } from './report-sheet'

// La hoja llega al tocar: el perfil lo abren sobre todo visitas sin sesión, que nunca la dibujan,
// y Next baja con la página todo el JavaScript que esta importa (presupuesto de docs/07).
const ReportSheet = dynamic(() => import('./report-sheet').then((module) => module.ReportSheet))

export type ProfileSafetyTexts = {
  report: string
  /** Nulo sin sesión: la hoja no se abre, y sus textos no viajan en la página. */
  sheet: ReportSheetTexts | null
}

type Props = {
  publicId: string
  profilePath: string
  /** Ya decidido por `safetyActions`. */
  actions: SafetyActions
  /** Vuelve de ingresar con la marca: la hoja ya abierta (FR-001). */
  openOnLoad: boolean
  texts: ProfileSafetyTexts
}

// Las herramientas de trabajo al pie del perfil (plan §Perfil público): chicas y en `ghost`, porque
// el perfil existe para mostrar a la persona y no para acusarla. Los botones salen en el HTML; sin
// sesión son enlaces a ingresar que vuelven con la marca.
export function ProfileSafetyActions({ publicId, profilePath, actions, openOnLoad, texts }: Props) {
  const [open, setOpen] = useState(openOnLoad)
  // Una hoja nueva cada vez que se abre: después de un reporte enviado se puede mandar otro.
  const [round, setRound] = useState(0)

  if (!actions.actions.includes('report')) return null
  if (actions.signIn || texts.sheet === null) {
    return (
      <LinkButton
        href={signInWithNext(withFlag(profilePath, REPORT_FLAG))}
        variant="ghost"
        size="sm"
      >
        {texts.report}
      </LinkButton>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setRound((previous) => previous + 1)
          setOpen(true)
        }}
      >
        {texts.report}
      </Button>
      {open ? (
        <ReportSheet
          key={round}
          publicId={publicId}
          profilePath={profilePath}
          open={open}
          onOpenChange={setOpen}
          texts={texts.sheet}
        />
      ) : null}
    </>
  )
}
