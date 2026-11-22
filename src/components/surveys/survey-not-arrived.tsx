import { Card } from '@/components/ui/card'
import { RetryNotice, type RetryTexts } from '@/components/ui/retry-notice'

// La encuesta que no llegó, en su lugar y en su nota (historia #352): el resto de la pantalla sigue
// entero y «Reintentar» la trae sin recargar, porque la atiende `deferredPart`.
export function SurveyNotArrived({ texts }: { texts: RetryTexts }) {
  return (
    <Card taped className="md:p-6">
      <RetryNotice texts={texts} />
    </Card>
  )
}
