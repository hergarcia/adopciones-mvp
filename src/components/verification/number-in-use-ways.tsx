import { LinkButton } from '@/components/ui/link-button'
import { NumberSentence } from './number-sentence'
import { VerifyHeading } from './verify-heading'

type Props = {
  /** `lead` con `{number}` adentro. */
  texts: { title: string; lead: string; verifyOther: string; continue: string }
  /** El número de la prueba, en formato de pantalla. */
  number: string
  /** «Verificar teléfono» con la misma puerta. */
  verifyHref: string
  /** Solo si la cuenta volvió a nivel 1 y se llegó por el aviso de una acción (FR-008c de la #10). */
  continueTo: string | null
  /** «Entrar con esa cuenta», con su aclaración. */
  signInOther: React.ReactNode
  /** «Es mío y no puedo entrar a esa cuenta», con la hora límite. */
  claimChoice: React.ReactNode
}

// El título nombra el problema y se anuncia; después los tres caminos, en este orden, sin nada de
// la otra cuenta (FR-001). La tirita es el próximo paso real de la mayoría: seguir a la acción si
// la cuenta volvió a nivel 1, o verificar otro número.
export function NumberInUseWays({
  texts,
  number,
  verifyHref,
  continueTo,
  signInOther,
  claimChoice,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div role="alert" className="mb-2">
        <VerifyHeading texts={{ title: texts.title, lead: null }} />
        <p className="mt-3 text-base text-ink">
          <NumberSentence template={texts.lead} number={number} />
        </p>
      </div>
      {continueTo ? (
        <>
          <LinkButton href={continueTo} variant="tirita" size="lg">
            {texts.continue}
          </LinkButton>
          <LinkButton href={verifyHref} variant="secondary" className="self-start">
            {texts.verifyOther}
          </LinkButton>
        </>
      ) : (
        <LinkButton href={verifyHref} variant="tirita" size="lg">
          {texts.verifyOther}
        </LinkButton>
      )}
      {signInOther}
      {claimChoice}
    </div>
  )
}
