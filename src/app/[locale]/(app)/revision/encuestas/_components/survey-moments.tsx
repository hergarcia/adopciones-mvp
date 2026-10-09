import { getTranslations } from 'next-intl/server'
import { SurveyAnswerList } from '@/components/surveys/survey-answer-list'
import { SurveyOptionBars } from '@/components/surveys/survey-option-bars'
import { SurveySummary } from '@/components/surveys/survey-summary'
import { SURVEY_SUMMARY_PATH } from '@/lib/feedback/paths'
import { LIST_STEP } from '@/lib/lists/newest-first'
import { calendarDayLabel } from '@/lib/moderation/day-label'
import { surveyAnswers } from '@/lib/supabase/queries/surveys'
import { optionBars } from '@/lib/surveys/option-bars'
import { surveyQuestion } from '@/lib/surveys/questions'
import type { SurveyMoment, SurveyMomentSummary } from '@/lib/surveys/types'

export type ShownAnswers = Record<SurveyMoment, number>

// «Ver más» de un momento: un tramo más de ese, las demás como estaban, y el ancla de la última que
// se veía.
function moreHref(shown: ShownAnswers, moment: SurveyMoment, lastId: string): string {
  const query = new URLSearchParams(
    Object.entries({ ...shown, [moment]: shown[moment] + LIST_STEP }).map(([key, value]) => [
      key,
      String(value),
    ]),
  )
  return `${SURVEY_SUMMARY_PATH}?${query.toString()}#${lastId}`
}

// Cada momento armado con sus textos, sus barras y sus respuestas libres: la página solo compone.
export async function surveyMoments(
  summaries: SurveyMomentSummary[],
  shown: ShownAnswers,
  locale: string,
) {
  const t = await getTranslations('surveys')
  return Promise.all(
    summaries.map(async (summary) => {
      const { question } = surveyQuestion(summary.moment)
      const hasAnswers = summary.answered > 0
      const answers = hasAnswers
        ? await surveyAnswers(summary.moment, shown[summary.moment])
        : { items: [], hasMore: false }
      const last = answers.items.at(-1)
      return (
        <SurveySummary
          key={summary.moment}
          id={`encuesta-${summary.moment}`}
          texts={{
            question: t(question),
            counts: t('summary.counts', {
              offered: summary.offered,
              answered: summary.answered,
              dismissed: summary.dismissed,
            }),
            empty: t('summary.empty'),
          }}
          hasAnswers={hasAnswers}
          bars={
            <SurveyOptionBars
              label={t('summary.bars_label')}
              bars={optionBars(summary.options).map((bar) => ({
                key: bar.option,
                label: t(`options.${bar.option}`),
                chosen: bar.chosen,
                share: bar.share,
                isTop: bar.isTop,
              }))}
            />
          }
          answers={
            <SurveyAnswerList
              answers={answers.items.map((answer) => ({
                id: answer.id,
                quote: t('summary.quote', { text: answer.body }),
                meta: t('summary.answer_meta', {
                  date: calendarDayLabel(answer.answeredOn, locale),
                  option: t(`options.${answer.option}`),
                }),
              }))}
              texts={{
                title: t('summary.answers_title'),
                label: t('summary.answers_label'),
                empty: t('summary.no_answers'),
                more: t('summary.more'),
              }}
              moreHref={
                answers.hasMore && last !== undefined
                  ? moreHref(shown, summary.moment, last.id)
                  : null
              }
            />
          }
        />
      )
    }),
  )
}
