import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { QuestionArticle } from '@/components/questions/question-article'
import { QuestionFooter } from '@/components/questions/question-footer'
import { QuestionJsonLd } from '@/components/questions/question-json-ld'
import { QuestionLayout } from '@/components/questions/question-layout'
import { QuestionSection } from '@/components/questions/question-section'
import { questionViewEvent } from '@/lib/analytics/question-events'
import { trackAll } from '@/lib/analytics/track'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { APP_NAME, APP_URL } from '@/lib/config'
import { questionBySlug } from '@/lib/questions/pages'
import { QUESTIONS_PATH, questionPath } from '@/lib/questions/paths'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import {
  questionCardTexts,
  questionMetadata,
  questionPageTexts,
} from '@/app/[locale]/_components/question-texts'
import { SharedBlocks } from './_components/shared-blocks'

type Props = { params: Promise<{ locale: string; slug: string }> }

// Una dirección que no es una página arma la tarjeta con el nombre del sitio y nada más, como la
// ficha de un animal que no existe (research R4). La canónica entera, como la de la portada.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = questionBySlug((await params).slug)
  if (page === null) return { title: { absolute: APP_NAME } }
  return questionMetadata({ ...(await questionCardTexts(page)), path: questionPath(page.slug) })
}

// Una página de «Preguntas y respuestas» (historia #8): pública, entera desde el servidor, y la
// apertura se cuenta con su origen antes de dibujar (FR-050).
export default async function QuestionScreen({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const page = questionBySlug(slug)
  if (page === null) notFound()
  await redirectIfSuspended()

  const [texts, request, index] = await Promise.all([
    questionPageTexts(page),
    headers(),
    getTranslations('questions.index'),
  ])
  const view = questionViewEvent({
    slug: page.slug,
    referer: request.get('referer'),
    host: request.get('host'),
    userAgent: request.get('user-agent'),
  })
  await trackAll(view === null ? [] : [view])

  return (
    <PageShell width="full">
      <QuestionJsonLd
        siteName={APP_NAME}
        siteUrl={APP_URL}
        index={{ title: index('title'), path: QUESTIONS_PATH }}
        page={{ title: texts.title, path: questionPath(page.slug), updatedOn: page.updatedOn }}
      />
      <QuestionLayout
        title={texts.title}
        article={
          <QuestionArticle
            answer={texts.answer}
            sections={texts.sections.map((section) => (
              <QuestionSection key={section.title} texts={section} />
            ))}
            shared={<SharedBlocks page={page} />}
          />
        }
        closing={<QuestionFooter texts={texts.footer} />}
      />
    </PageShell>
  )
}
