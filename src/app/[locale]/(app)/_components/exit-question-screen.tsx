import { answerVerificationExit, skipVerificationExit } from '@/actions/verification-exit'
import { LazyExitQuestion } from '@/components/verification/lazy-exit-question'
import { hasExitTicket } from '@/lib/verification/exit-cookie'
import {
  EXIT_QUESTION_FLAG,
  isQuestionShown,
  type ExitLevel,
} from '@/lib/verification/exit-question'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { exitQuestionTexts } from '@/app/[locale]/_components/verification-exit-texts'

// La pregunta en lugar de la pantalla que se deja, o null para dibujar la de siempre. Sin el ticket
// —vencido, contestado en otra pestaña— la marca ya está y no se pregunta de nuevo. Baja solo cuando
// se dibuja: importada directo, viajaba con cada apertura de las pantallas de verificar (#322).
export async function exitQuestionIfShown(
  level: ExitLevel,
  query: { [EXIT_QUESTION_FLAG]?: string },
  /** A donde llevaba la salida antes de la pregunta. */
  destination: string,
): Promise<React.ReactNode> {
  if (!isQuestionShown(query) || !(await hasExitTicket(level))) return null
  return (
    <PageShell width="wide">
      <LazyExitQuestion
        level={level}
        texts={await exitQuestionTexts(level)}
        destination={destination}
        answer={answerVerificationExit}
        skip={skipVerificationExit}
      />
    </PageShell>
  )
}
