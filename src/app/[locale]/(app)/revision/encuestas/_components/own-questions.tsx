import { getTranslations } from 'next-intl/server'
import { SurveyAnswerList } from '@/components/surveys/survey-answer-list'
import { ownQuestionView, type OwnQuestionSummary } from '@/lib/surveys/own-questions'
import { OWN_QUESTIONS_LIST_KEY, moreHref, type ShownLists } from './shown-lists'

const SECTION_ID = 'lo-que-preguntan-quienes-publican'

// «Lo que preguntan quienes publican» (historia #292): de lo publicado hoy, cuántas publicaciones
// tienen una pregunta propia y cuáles son, sin la persona, el animal ni ninguna respuesta (FR-022,
// FR-024). Si no se pudo traer, lo dice acá y el resto de Encuestas se ve igual (FR-023).
export async function ownQuestions(summary: OwnQuestionSummary | null, shown: ShownLists) {
  const [t, quotes] = await Promise.all([
    getTranslations('surveys.own_questions'),
    getTranslations('surveys.summary'),
  ])
  const view = summary === null ? null : ownQuestionView(summary, shown[OWN_QUESTIONS_LIST_KEY])
  const listed = view !== null && view.withQuestion > 0 ? view : null
  const last = listed?.items.at(-1)

  return (
    <section
      aria-labelledby={SECTION_ID}
      className="flex flex-col gap-6 border-t-2 border-line pt-8"
    >
      <div className="flex flex-col gap-2">
        <h2 id={SECTION_ID} className="text-xl font-bold text-ink">
          {t('title')}
        </h2>
        {listed === null ? (
          <p className="text-base text-ink-muted">{view === null ? t('failed') : t('empty')}</p>
        ) : (
          <p className="text-sm text-ink-muted">
            {t('counts', { with: listed.withQuestion, published: listed.published })}
          </p>
        )}
      </div>
      {listed === null ? null : (
        <SurveyAnswerList
          answers={listed.items.map((item) => ({
            id: item.id,
            quote: quotes('quote', { text: item.question }),
          }))}
          texts={{
            title: t('list_title'),
            label: t('list_label'),
            empty: t('empty'),
            more: t('more'),
          }}
          moreHref={
            listed.hasMore && last !== undefined
              ? moreHref(shown, OWN_QUESTIONS_LIST_KEY, last.id)
              : null
          }
        />
      )}
    </section>
  )
}
