import { LinkButton } from '@/components/ui/link-button'

type Props = {
  texts: { inUseWays: string; verifyOther: string; continue: string }
  /** «Verificar teléfono» con la misma puerta. */
  verifyHref: string
  /** Solo si era un cambio y se llegó por el aviso: la cuenta volvió a nivel 1 (FR-008c). */
  continueTo: string | undefined
}

// Los caminos de quien encuentra su número verificado en otra cuenta, sin nada de esa cuenta
// (FR-008). Si la cuenta volvió a nivel 1, el próximo paso real es la acción que se tocó, y esa
// lleva la tirita; si no, verificar otro número.
export function NumberInUseWays({ texts, verifyHref, continueTo }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink">{texts.inUseWays}</p>
      {continueTo ? (
        <LinkButton href={continueTo} variant="tirita" size="lg" className="w-full">
          {texts.continue}
        </LinkButton>
      ) : null}
      <LinkButton
        href={verifyHref}
        variant={continueTo ? 'secondary' : 'tirita'}
        size={continueTo ? 'md' : 'lg'}
        className={continueTo ? 'self-start' : 'w-full'}
      >
        {texts.verifyOther}
      </LinkButton>
    </div>
  )
}
