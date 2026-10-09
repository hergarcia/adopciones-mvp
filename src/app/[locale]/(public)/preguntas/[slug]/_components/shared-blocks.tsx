import { getLocale, getTranslations } from 'next-intl/server'
import { CommitmentText } from '@/components/adoptions/commitment-text'
import { QuestionSection } from '@/components/questions/question-section'
import { IdentityConsentBody } from '@/components/verification/identity-consent'
import { LevelLadder } from '@/components/verification/level-ladder'
import { commitmentTexts } from '@/lib/adoptions/commitment-texts'
import { LEVELS_PATH } from '@/lib/profile/public-paths'
import type { QuestionPage, SharedBlock } from '@/lib/questions/pages'
import { identityConsentTexts } from '@/app/[locale]/_components/identity-texts'
import { levelSteps } from '@/app/[locale]/_components/level-texts'

// Lo que una página toma de otras pantallas, con las mismas claves y los mismos componentes, así no
// puede decir otra cosa que ellas (FR-009, FR-010). Ningún texto propio salvo el título del bloque.
export async function SharedBlocks({ page }: { page: QuestionPage }) {
  const shared: readonly SharedBlock[] = 'shared' in page ? page.shared : []
  if (shared.length === 0) return null
  const blocks = await Promise.all(shared.map((block) => sharedBlock(block)))
  return <>{blocks}</>
}

async function sharedBlock(block: SharedBlock) {
  const [t, levels] = await Promise.all([
    getTranslations('questions'),
    getTranslations('verification.levels'),
  ])
  const titled = (title: string) => ({ title, paragraphs: [], sources: [] })
  if (block === 'levels') {
    return (
      <QuestionSection
        key={block}
        texts={titled(t('levels_title'))}
        more={{ href: LEVELS_PATH, label: levels('title') }}
      >
        <LevelLadder
          levels={await levelSteps()}
          highlighted={null}
          headingLevel={3}
          className="flex flex-col gap-8"
        />
      </QuestionSection>
    )
  }
  if (block === 'identity_images') {
    return (
      <QuestionSection key={block} texts={titled(t('identity_title'))}>
        <IdentityConsentBody texts={await identityConsentTexts()} headingLevel={3} />
      </QuestionSection>
    )
  }
  const commitment = await commitmentTexts(
    {
      adopter: t('example.adopter'),
      publisher: t('example.publisher'),
      pet: t('example.pet'),
      sex: 'male',
    },
    true,
    await getLocale(),
  )
  return (
    <QuestionSection
      key={block}
      texts={titled(t('commitment_title'))}
      note={t('page.example_note')}
    >
      <CommitmentText clauses={commitment.clauses} note={commitment.note} />
    </QuestionSection>
  )
}
