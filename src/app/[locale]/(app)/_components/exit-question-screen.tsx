import { answerVerificationExit, skipVerificationExit } from '@/actions/verification-exit'
import { ExitQuestion } from '@/components/verification/exit-question'
import type { ExitLevel } from '@/lib/verification/exit-question'
import { exitQuestionTexts } from '@/app/[locale]/_components/verification-exit-texts'

type Props = {
  level: ExitLevel
  /** A donde llevaba la salida antes de la pregunta. */
  destination: string
}

// «¿Qué te frena?» con sus textos y sus acciones, en el lugar de la pantalla que se deja.
export async function ExitQuestionScreen({ level, destination }: Props) {
  return (
    <ExitQuestion
      level={level}
      texts={await exitQuestionTexts(level)}
      destination={destination}
      answer={answerVerificationExit}
      skip={skipVerificationExit}
    />
  )
}
