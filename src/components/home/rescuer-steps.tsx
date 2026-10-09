import { NumberedList } from '@/components/ui/numbered-list'

export type RescuerStepsTexts = { title: string; steps: readonly string[] }

export function RescuerSteps({ texts }: { texts: RescuerStepsTexts }) {
  return (
    <section aria-labelledby="rescuer-steps-title">
      <h2 id="rescuer-steps-title" className="afiche text-xl text-ink">
        {texts.title}
      </h2>
      <NumberedList items={texts.steps} columns="two" className="mt-6" />
    </section>
  )
}
