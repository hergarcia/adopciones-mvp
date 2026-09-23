import { LinkButton } from '@/components/ui/link-button'

type Props = {
  texts: { inUseWays: string; verifyOther: string; continue: string }
  /** «Verificar teléfono» con la misma puerta. */
  verifyHref: string
  /** Solo si era un cambio y se llegó por el aviso: la cuenta volvió a nivel 1 (FR-008c). */
  continueTo: string | undefined
}

// Los caminos de quien encuentra su número verificado en otra cuenta, sin nada de esa cuenta
// (FR-008): verificar otro, entrar con la otra, o seguir a la acción si la cuenta quedó verificada.
export function NumberInUseWays({ texts, verifyHref, continueTo }: Props) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-ink">{texts.inUseWays}</p>
      <LinkButton href={verifyHref} variant="secondary">
        {texts.verifyOther}
      </LinkButton>
      {continueTo ? (
        <LinkButton href={continueTo} variant="ghost">
          {texts.continue}
        </LinkButton>
      ) : null}
    </div>
  )
}
