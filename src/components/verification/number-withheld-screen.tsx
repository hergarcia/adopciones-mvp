import { SingleTaskColumns } from '@/components/forms/single-task-columns'
import { LinkButton } from '@/components/ui/link-button'
import { VerifyHeading } from './verify-heading'

type Props = {
  texts: { title: string; lead: string; verifyOther: string; continue: string }
  /** La frase del correo de ayuda, con su enlace. */
  help: React.ReactNode
  /** «Verificar teléfono» con la misma puerta. */
  verifyHref: string
  /** Solo si la cuenta sigue en nivel 1 y se llegó por el aviso de una acción. */
  continueTo: string | null
  /** «Ahora no», cuando se llegó por la puerta de una acción. */
  notNow?: React.ReactNode
}

// No dice por qué: nada de la otra cuenta, ni si está suspendida o se borró (FR-026, FR-028). Sin el
// camino de quedarse con el número, que es lo que distingue esta pantalla de «en otra cuenta».
export function NumberWithheldScreen({
  texts,
  help,
  verifyHref,
  continueTo,
  notNow = null,
}: Props) {
  return (
    <SingleTaskColumns
      presentation={
        <div role="alert">
          <VerifyHeading texts={{ title: texts.title, lead: texts.lead }} />
          <p className="mt-3 text-base text-ink-muted">{help}</p>
        </div>
      }
      task={
        <div className="mt-8 flex flex-col">
          <div className="flex flex-col gap-6">
            {continueTo ? (
              <LinkButton href={continueTo} variant="tirita" size="lg">
                {texts.continue}
              </LinkButton>
            ) : null}
            <LinkButton
              href={verifyHref}
              variant={continueTo ? 'secondary' : 'tirita'}
              size={continueTo ? undefined : 'lg'}
              className={continueTo ? 'self-start' : undefined}
            >
              {texts.verifyOther}
            </LinkButton>
          </div>
          {notNow}
        </div>
      }
    />
  )
}
