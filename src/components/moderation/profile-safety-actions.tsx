'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { signInWithNext } from '@/lib/auth/next-destination'
import {
  REPORT_FLAG,
  SUSPENDED_LIST_PATH,
  SUSPENDED_NAME_FLAG,
  withFlag,
} from '@/lib/moderation/paths'
import type { SafetyActions } from '@/lib/moderation/safety-actions'
import type { ReportSheetTexts } from './report-sheet'
import type { SuspendSheetTexts } from './suspend-sheet'

// La hoja llega al tocar: el perfil lo abren sobre todo visitas sin sesión, que nunca la dibujan,
// y Next baja con la página todo el JavaScript que esta importa (presupuesto de docs/07).
const ReportSheet = dynamic(() => import('./report-sheet').then((module) => module.ReportSheet))
const SuspendSheet = dynamic(() => import('./suspend-sheet').then((module) => module.SuspendSheet))

export type ProfileSafetyTexts = {
  report: string
  /** Nulo sin sesión: la hoja no se abre, y sus textos no viajan en la página. */
  sheet: ReportSheetTexts | null
  suspend: string
  /** Solo para quien administra. */
  suspendSheet: SuspendSheetTexts | null
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
  const router = useRouter()
  const [open, setOpen] = useState<'report' | 'suspend' | null>(openOnLoad ? 'report' : null)
  // Una hoja nueva cada vez que se abre: después de un reporte enviado se puede mandar otro.
  const [round, setRound] = useState(0)

  function show(sheet: 'report' | 'suspend') {
    setRound((previous) => previous + 1)
    setOpen(sheet)
  }

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

  const canSuspend = actions.actions.includes('suspend') && texts.suspendSheet !== null
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => show('report')}>
        {texts.report}
      </Button>
      {canSuspend ? (
        <Button variant="ghost" size="sm" onClick={() => show('suspend')}>
          {texts.suspend}
        </Button>
      ) : null}
      {open === 'report' ? (
        <ReportSheet
          key={round}
          publicId={publicId}
          profilePath={profilePath}
          open
          onOpenChange={(next) => setOpen(next ? 'report' : null)}
          texts={texts.sheet}
        />
      ) : null}
      {open === 'suspend' && texts.suspendSheet !== null ? (
        <SuspendSheet
          key={round}
          publicId={publicId}
          reportId={null}
          open
          onOpenChange={(next) => setOpen(next ? 'suspend' : null)}
          onDone={(name) =>
            router.push(`${SUSPENDED_LIST_PATH}?${SUSPENDED_NAME_FLAG}=${encodeURIComponent(name)}`)
          }
          onRefused={() => {
            setOpen(null)
            router.refresh()
          }}
          texts={texts.suspendSheet}
        />
      ) : null}
    </>
  )
}
