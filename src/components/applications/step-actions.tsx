import { Button } from '@/components/ui/button'

type Props = {
  isLast: boolean
  canGoBack: boolean
  busy: boolean
  disabled: boolean
  onBack: () => void
  /** Ya traducidos. */
  texts: { next: string; back: string; submit: string }
}

// Los botones de un paso del cuestionario: «Siguiente» mientras quedan preguntas y, en la última,
// «Enviar solicitud», la tirita de la pantalla. Los dos envían el formulario: Enter avanza igual.
// «Anterior» pesa menos, en `ghost`, a la izquierda desde 768.
export function StepActions({ isLast, canGoBack, busy, disabled, onBack, texts }: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:items-center md:justify-end md:gap-6">
      {isLast ? (
        <Button
          type="submit"
          variant="tirita"
          size="lg"
          loading={busy}
          disabled={disabled}
          className="md:w-auto"
        >
          {texts.submit}
        </Button>
      ) : (
        <Button type="submit" size="lg" disabled={disabled}>
          {texts.next}
        </Button>
      )}
      {canGoBack ? (
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          className="self-start"
          onClick={onBack}
        >
          {texts.back}
        </Button>
      ) : null}
    </div>
  )
}
