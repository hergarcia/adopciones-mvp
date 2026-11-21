import { getTranslations } from 'next-intl/server'
import { ExitOriginTable } from '@/components/surveys/exit-origin-table'
import { SurveySummary } from '@/components/surveys/survey-summary'
import { DELETION_KINDS } from '@/lib/pets/deletion-reason'
import { deletionReasonSummary, type DeletionSummaryRow } from '@/lib/surveys/deletion-summary'
import { optionBars } from '@/lib/surveys/option-bars'

const SECTION_ID = 'por-que-se-borraron-animales'

// «Por qué se borraron animales» (historia #263): cuántos se borraron con la pregunta y cuántas
// veces se eligió cada opción, en total y en animales y camadas. Solo cuentas: nada lleva a quien
// borró ni al animal (FR-022).
export async function deletionReasons(rows: DeletionSummaryRow[]) {
  const t = await getTranslations('surveys.deletions')
  const summary = deletionReasonSummary(rows)
  const bars = optionBars(
    summary.options.map((option) => ({ option: option.option, chosen: option.total })),
  )

  return (
    <section
      aria-labelledby={SECTION_ID}
      className="flex flex-col gap-8 border-t-2 border-line pt-8 [&>section]:border-t-0 [&>section]:pt-0"
    >
      <h2 id={SECTION_ID} className="text-xl font-bold text-ink">
        {t('title')}
      </h2>
      {summary.asked === 0 ? (
        <p className="text-base text-ink-muted">{t('empty')}</p>
      ) : (
        <SurveySummary
          id="borrados"
          heading="h3"
          texts={{
            question: t('question'),
            counts: t('counts', {
              pets: summary.byKind.pet.asked,
              litters: summary.byKind.litter.asked,
              answered: summary.answered,
              unanswered: summary.unanswered,
            }),
            empty: t('no_answers'),
          }}
          hasAnswers={summary.answered > 0}
          // Las opciones se ven también en cero, con la frase de que nadie contestó arriba (US3-AS4).
          showBarsWhenEmpty
          bars={null}
          answers={
            <ExitOriginTable
              texts={{
                caption: t('table_caption'),
                optionHeader: t('option_header'),
                totalHeader: t('total_header'),
              }}
              origins={DELETION_KINDS.map((kind) => ({ key: kind, label: t(`kinds.${kind}`) }))}
              rows={summary.options.map((option, index) => ({
                key: option.option,
                label: t(`options.${option.option}`),
                total: option.total,
                share: bars[index]?.share ?? 0,
                isTop: bars[index]?.isTop ?? false,
                counts: DELETION_KINDS.map((kind) => option.byKind[kind]),
              }))}
            />
          }
        />
      )}
    </section>
  )
}
