import { LinkButton } from '@/components/ui/link-button'
import { VerifyHeading } from './verify-heading'

type Props = {
  texts: { inUseTitle: string; inUseWays: string; verifyOther: string; continue: string }
  /** «Verificar teléfono» con la misma puerta. */
  verifyHref: string
  /** Solo si era un cambio y se llegó por el aviso: la cuenta volvió a nivel 1 (FR-008c). */
  continueTo: string | undefined
}

// Reemplaza la pantalla del código cuando el número está en otra cuenta: el título nombra el
// problema y se anuncia, y quedan los caminos, sin nada de esa cuenta (FR-008). Si la cuenta volvió
// a nivel 1, el próximo paso real es la acción que se tocó, y esa lleva la tirita; si no, verificar
// otro número.
export function NumberInUseWays({ texts, verifyHref, continueTo }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div role="alert" className="mb-2">
        <VerifyHeading texts={{ title: texts.inUseTitle, lead: null }} />
      </div>
      <p className="text-sm text-ink">{texts.inUseWays}</p>
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
    </div>
  )
}
