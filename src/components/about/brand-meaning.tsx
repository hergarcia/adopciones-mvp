import { QuestionSection } from '@/components/questions/question-section'
import { BrandEquation, type BrandEquationTexts } from './brand-equation'

export type BrandMeaningTexts = {
  title: string
  lead: string
  equation: BrandEquationTexts
  /** Lo que anuncia el lector de pantalla en lugar de la marca de la suma. */
  image: string
}

// Una parte más de la página, con la suma después de la bajada que cuenta las dos huellas.
export function BrandMeaning({ texts }: { texts: BrandMeaningTexts }) {
  return (
    <QuestionSection
      texts={{ title: texts.title, paragraphs: [texts.lead], list: null, sources: [] }}
    >
      <div className="pt-6">
        <BrandEquation texts={texts.equation} markLabel={texts.image} />
      </div>
    </QuestionSection>
  )
}
