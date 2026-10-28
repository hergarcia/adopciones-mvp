import { getTranslations } from 'next-intl/server'
import { ExitOriginTable } from '@/components/surveys/exit-origin-table'
import { SurveyAnswerList } from '@/components/surveys/survey-answer-list'
import { SurveyOptionBars } from '@/components/surveys/survey-option-bars'
import { SurveySummary } from '@/components/surveys/survey-summary'
import { calendarDayLabel } from '@/lib/moderation/day-label'
import { verificationExitTexts } from '@/lib/supabase/queries/verification-exits'
import {
  exitSummaryBlocks,
  type ExitLevelSummary,
  type ExitSummaryRow,
} from '@/lib/surveys/exit-summary'
import { optionBars } from '@/lib/surveys/option-bars'
import { EXIT_ORIGINS } from '@/lib/verification/exit-question'
import { exitOptionLabels } from '@/app/[locale]/_components/verification-exit-texts'
import { EXIT_LIST_KEY, moreHref, type ShownLists } from './shown-lists'

const SECTION_ID = 'por-que-no-se-verificaron'

async function exitLevelBlock(block: ExitLevelSummary, shown: ShownLists, locale: string) {
  const [t, summary, labels] = await Promise.all([
    getTranslations('surveys.exits'),
    getTranslations('surveys.summary'),
    exitOptionLabels(block.level),
  ])
  const listKey = EXIT_LIST_KEY[block.level]
  const texts = block.options.some((option) => option.option === 'other' && option.total > 0)
    ? await verificationExitTexts(block.level, shown[listKey])
    : { items: [], hasMore: false }
  const last = texts.items.at(-1)
  const label = (option: string) => labels[option] ?? option

  return (
    <SurveySummary
      key={block.level}
      id={`salida-${block.level}`}
      heading="h3"
      texts={{
        question: t(`levels.${block.level}`),
        counts: t('counts', {
          asked: block.asked,
          answered: block.answered,
          skipped: block.skipped,
        }),
        empty: t('no_answers'),
      }}
      // Las opciones se ven también en cero (US3-AS5): la frase de que nadie contestó va arriba.
      hasAnswers
      bars={
        <>
          {block.asked > 0 && block.answered === 0 ? (
            <p className="text-base text-ink-muted">{t('no_answers')}</p>
          ) : null}
          <SurveyOptionBars
            label={t('bars_label')}
            bars={optionBars(
              block.options.map((option) => ({ option: option.option, chosen: option.total })),
            ).map((bar) => ({
              key: bar.option,
              label: label(bar.option),
              chosen: bar.chosen,
              share: bar.share,
              isTop: bar.isTop,
            }))}
          />
          <ExitOriginTable
            texts={{ caption: t('table_caption'), optionHeader: t('option_header') }}
            origins={EXIT_ORIGINS.map((origin) => ({ key: origin, label: t(`origins.${origin}`) }))}
            rows={block.options.map((option) => ({
              key: option.option,
              label: label(option.option),
              counts: EXIT_ORIGINS.map((origin) => option.byOrigin[origin]),
            }))}
          />
        </>
      }
      answers={
        <SurveyAnswerList
          heading="h4"
          answers={texts.items.map((text) => ({
            id: text.id,
            quote: summary('quote', { text: text.body }),
            meta: calendarDayLabel(text.answeredOn, locale),
          }))}
          texts={{
            title: summary('answers_title'),
            label: t('texts_label'),
            empty: summary('no_answers'),
            more: summary('more'),
          }}
          moreHref={texts.hasMore && last !== undefined ? moreHref(shown, listKey, last.id) : null}
        />
      }
    />
  )
}

// «Por qué no se verificaron» (historia #234, US3): un bloque por nivel con sus cuentas, cada
// opción en total y por origen, y los textos de «Otra cosa» con el día, sin el nombre de nadie
// (FR-022). Sin ninguna pregunta hecha, una sola frase en lugar de los bloques.
export async function verificationExits(rows: ExitSummaryRow[], shown: ShownLists, locale: string) {
  const t = await getTranslations('surveys.exits')
  const blocks = exitSummaryBlocks(rows)
  const content = blocks.every((block) => block.asked === 0) ? (
    <p className="text-base text-ink-muted">{t('empty')}</p>
  ) : (
    await Promise.all(blocks.map((block) => exitLevelBlock(block, shown, locale)))
  )

  return (
    <section
      aria-labelledby={SECTION_ID}
      className="flex flex-col gap-8 border-t-2 border-line pt-8"
    >
      <h2 id={SECTION_ID} className="text-xl font-bold text-ink">
        {t('title')}
      </h2>
      {content}
    </section>
  )
}
