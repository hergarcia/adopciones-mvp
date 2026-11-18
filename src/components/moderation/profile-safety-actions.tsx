'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LinkButton } from '@/components/ui/link-button'
import { TapButton } from '@/components/ui/tap-button'
import { withLayers } from '@/components/ui/with-layers'
import { signInWithNext } from '@/lib/auth/next-destination'
import {
  BLOCK_FLAG,
  REPORT_FLAG,
  SUSPENDED_LIST_PATH,
  SUSPENDED_NAME_FLAG,
  withFlag,
} from '@/lib/moderation/paths'
import type { SafetyActions } from '@/lib/moderation/safety-actions'
import type { BlockDialogTexts } from './block-dialog'
import type { ReportSheetTexts } from './report-sheet'
import type { SuspendSheetTexts } from './suspend-sheet'

// La hoja llega al tocar: el perfil lo abren sobre todo visitas sin sesión, que nunca la dibujan,
// y Next baja con la página todo el JavaScript que esta importa (presupuesto de docs/07). El botón
// espera la hoja y su capa antes de abrirla (historia #318).
const loadReport = () => import('./report-sheet')
const loadSuspend = () => import('./suspend-sheet')
const loadBlock = () => import('./block-dialog')
const ReportSheet = dynamic(() => loadReport().then((module) => module.ReportSheet))
const SuspendSheet = dynamic(() => loadSuspend().then((module) => module.SuspendSheet))
const BlockDialog = dynamic(() => loadBlock().then((module) => module.BlockDialog))
const withOverlay = (load: () => Promise<unknown>) => () => withLayers(load(), { overlay: true })

type Overlay = 'report' | 'block' | 'suspend'

export type ProfileSafetyTexts = {
  report: string
  block: string
  /** Nulo sin sesión: la hoja no se abre, y sus textos no viajan en la página. */
  sheet: ReportSheetTexts | null
  /** Nulo sin sesión, o en el perfil bloqueado, que ofrece desbloquear. */
  blockDialog: BlockDialogTexts | null
  suspend: string
  /** Solo para quien administra. */
  suspendSheet: SuspendSheetTexts | null
}

type Props = {
  publicId: string
  profilePath: string
  /** Ya decidido por `safetyActions`. */
  actions: SafetyActions
  /** Vuelve de ingresar con la marca: la hoja o la confirmación ya abierta (FR-001, US3-AS8). */
  openOnLoad: 'report' | 'block' | null
  texts: ProfileSafetyTexts
}

// Las herramientas de trabajo al pie del perfil (plan §Perfil público): chicas y en `ghost`, porque
// el perfil existe para mostrar a la persona y no para acusarla. Los botones salen en el HTML; sin
// sesión son enlaces a ingresar que vuelven con la marca.
export function ProfileSafetyActions({ publicId, profilePath, actions, openOnLoad, texts }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<Overlay | null>(openOnLoad)
  // Una hoja nueva cada vez que se abre: después de un reporte enviado se puede mandar otro.
  const [round, setRound] = useState(0)

  function show(sheet: Overlay) {
    setRound((previous) => previous + 1)
    setOpen(sheet)
  }

  if (!actions.actions.includes('report')) return null
  const canBlock = actions.actions.includes('block')
  if (actions.signIn || texts.sheet === null) {
    return (
      <>
        <LinkButton
          href={signInWithNext(withFlag(profilePath, REPORT_FLAG))}
          variant="ghost"
          size="sm"
        >
          {texts.report}
        </LinkButton>
        {canBlock ? (
          <LinkButton
            href={signInWithNext(withFlag(profilePath, BLOCK_FLAG))}
            variant="ghost"
            size="sm"
          >
            {texts.block}
          </LinkButton>
        ) : null}
      </>
    )
  }

  const canSuspend = actions.actions.includes('suspend') && texts.suspendSheet !== null
  return (
    <>
      <TapButton
        variant="ghost"
        size="sm"
        load={withOverlay(loadReport)}
        onArrive={() => show('report')}
      >
        {texts.report}
      </TapButton>
      {canBlock && texts.blockDialog !== null ? (
        <TapButton
          variant="ghost"
          size="sm"
          load={withOverlay(loadBlock)}
          onArrive={() => show('block')}
        >
          {texts.block}
        </TapButton>
      ) : null}
      {canSuspend ? (
        <TapButton
          variant="ghost"
          size="sm"
          load={withOverlay(loadSuspend)}
          onArrive={() => show('suspend')}
        >
          {texts.suspend}
        </TapButton>
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
      {open === 'block' && canBlock && texts.blockDialog !== null ? (
        <BlockDialog
          key={round}
          publicId={publicId}
          profilePath={profilePath}
          open
          onOpenChange={(next) => setOpen(next ? 'block' : null)}
          texts={texts.blockDialog}
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
