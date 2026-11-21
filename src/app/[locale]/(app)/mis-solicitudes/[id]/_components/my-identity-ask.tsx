import { IdentityAskNote } from '@/components/applications/identity-ask-note'
import { myIdentityAskView } from '@/lib/applications/identity-ask'
import { identityForApplicationPath, myApplicationPath } from '@/lib/applications/paths'
import type { ApplicationDetail } from '@/lib/applications/types'
import { levelsPath } from '@/lib/profile/public-paths'
import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { identityStatus, type IdentityStatus } from '@/lib/verification/identity-status'
import { identityAskNoteTexts } from '@/app/[locale]/_components/identity-ask-texts'

type Props = {
  application: Pick<
    ApplicationDetail,
    'id' | 'status' | 'identityAsk' | 'petName' | 'publisherName'
  >
  /** Con una pregunta sin contestar, «Enviar respuesta» es la tirita de la pantalla. */
  hasPendingQuestion: boolean
}

// Si su pedido de verificación no se puede leer, la nota ofrece verificar: la pantalla de verificar
// muestra el estado real (spec §Edge Cases).
async function myIdentity(): Promise<IdentityStatus> {
  const record = await getMyIdentity().catch(() => null)
  return record === null ? { kind: 'none' } : identityStatus(record, new Date())
}

// El pedido de identidad de quien publicó en Mi solicitud (historia #257): sin pedido, o con la
// solicitud fuera de «esperando respuesta», no hay nada y no se lee su verificación.
export async function MyIdentityAsk({ application, hasPendingQuestion }: Props) {
  if (application.identityAsk === null || application.status !== 'sent') return null
  const view = myIdentityAskView(application, await myIdentity())
  if (view.kind === 'none') return null
  const level = view.kind === 'verified' ? null : view.publisherLevel
  const back = myApplicationPath(application.id)
  return (
    <IdentityAskNote
      view={view}
      texts={await identityAskNoteTexts(view, {
        pet: application.petName,
        publisher: application.publisherName,
      })}
      badge={level === null || level === 0 ? null : { level, href: levelsPath(level, back) }}
      href={identityForApplicationPath(application.id)}
      emphasis={hasPendingQuestion ? 'secondary' : 'tirita'}
    />
  )
}
