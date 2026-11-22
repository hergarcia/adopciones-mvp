import { button } from '@/components/ui/button-styles'
import { Card } from '@/components/ui/card'
import { field } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { SurveyCardTexts } from './survey-card'

type Props = {
  texts: Pick<
    SurveyCardTexts,
    'question' | 'options' | 'openQuestion' | 'anonymous' | 'send' | 'dismiss'
  >
  /** El de `SurveyCard`, en la pared de Mis animales. */
  title?: string
}

// La encuesta mientras llega (historia #352): la nota con cinta y, donde va cada parte, su espera. Cada
// espera tapa el texto que va a tener, invisible, así se parte en los mismos renglones que la encuesta
// y lo de abajo no se corre cuando llega, a cualquier ancho y en los tres momentos.
export function SurveyCardSkeleton({ texts, title }: Props) {
  return (
    <Card taped className="flex flex-col gap-4 md:p-6">
      {title === undefined ? null : (
        <Hole>
          <p className="afiche text-xl">{title}</p>
        </Hole>
      )}
      <div>
        <Hole>
          <p className="mb-2 text-lg">{texts.question}</p>
        </Hole>
        <div className="flex flex-wrap gap-2">
          {texts.options.map((option) => (
            <Hole key={option.value}>
              <span className="inline-flex min-h-11 min-w-11 items-center border-2 px-4 text-base">
                {option.label}
              </span>
            </Hole>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Hole>
          <p className="text-sm">{texts.openQuestion}</p>
        </Hole>
        <Hole wide>
          <textarea
            rows={3}
            tabIndex={-1}
            className={cn(field({ shape: 'box' }), 'block w-full')}
          />
        </Hole>
      </div>
      <Hole>
        <p className="text-sm">{texts.anonymous}</p>
      </Hole>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Hole>
          <span className={button({ variant: 'secondary' })}>{texts.send}</span>
        </Hole>
        <Hole>
          <span className={button({ variant: 'ghost' })}>{texts.dismiss}</span>
        </Hole>
      </div>
    </Card>
  )
}

// Lo de adentro da la forma y no se ve; la espera lo tapa entero. Un margen de lo de adentro queda
// afuera de la espera, como el de la pregunta sobre sus opciones.
function Hole({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('relative max-w-full', wide ? 'w-full' : 'w-fit')}>
      <div className="invisible">{children}</div>
      <Skeleton className="absolute inset-0" />
    </div>
  )
}
