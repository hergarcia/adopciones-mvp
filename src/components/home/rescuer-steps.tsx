import { NumberedList } from '@/components/ui/numbered-list'

export type RescuerStepsTexts = { title: string; steps: readonly string[] }

export function RescuerSteps({ texts }: { texts: RescuerStepsTexts }) {
  return (
    <section aria-labelledby="rescuer-steps-title">
      <h2 id="rescuer-steps-title" className="afiche text-xl text-ink">
        {texts.title}
      </h2>
      <NumberedList items={texts.steps} className="mt-6 grid lg:grid-cols-2 lg:gap-8" />
    </section>
  )
}
