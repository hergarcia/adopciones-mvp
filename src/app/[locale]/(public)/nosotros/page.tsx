import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BrandMeaning } from '@/components/about/brand-meaning'
import { QuestionArticle } from '@/components/questions/question-article'
import { QuestionFooter } from '@/components/questions/question-footer'
import { QuestionLayout } from '@/components/questions/question-layout'
import { QuestionSection } from '@/components/questions/question-section'
import { ABOUT_PATH, withBrand } from '@/lib/about/page'
import { LEVELS_PATH } from '@/lib/profile/public-paths'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { aboutCardTexts, aboutTexts } from '@/app/[locale]/_components/about-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { questionMetadata } from '@/app/[locale]/_components/question-texts'

type Props = { params: Promise<{ locale: string }> }

// La tarjeta y la canónica como las de una pregunta: es una página de contenido más (research R6).
export async function generateMetadata(): Promise<Metadata> {
  return questionMetadata({ ...(await aboutCardTexts()), path: ABOUT_PATH })
}

// «Nosotros» (historia #201): pública, la misma con sesión y sin ella, entera desde el servidor y
// sin eventos, porque no es un paso del funnel.
export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()
  const texts = await aboutTexts()

  return (
    <PageShell width="full">
      <QuestionLayout
        title={texts.title}
        article={
          <QuestionArticle
            answer={texts.lead}
            sections={withBrand(
              texts.sections.map((section) => (
                <QuestionSection
                  key={section.texts.title}
                  texts={section.texts}
                  // Sin traerla antes: abrir los niveles se cuenta.
                  more={
                    section.levels
                      ? { href: LEVELS_PATH, label: section.levels, prefetch: false }
                      : undefined
                  }
                />
              )),
              <BrandMeaning key="brand" texts={texts.brand} />,
            )}
            shared={null}
          />
        }
        closing={<QuestionFooter texts={texts.footer} />}
      />
    </PageShell>
  )
}
