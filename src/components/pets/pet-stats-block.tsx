import { RequiredLevelLine } from '@/components/applications/required-level-line'
import { GroupPostButton } from './group-post-button'
import type { PetStatsView } from './pet-stats-texts'

type Props = {
  view: PetStatsView
  /** El id del título, para que la sección se nombre con él. */
  titleId: string
}

// «Cómo le va a…» (historia #269). Los números en voz de afiche y todos en tinta: un freno en color se
// leería como alarma y empujaría a bajar el nivel, que la historia decidió no sugerir. El número se
// dibuja antes que su texto, sin cambiar el orden del DOM: el lector dice «veces que se abrió la
// ficha, 40».
export function PetStatsBlock({ view, titleId }: Props) {
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <PetStatsHeading id={titleId} title={view.title} since={view.since} />
      {view.body.kind === 'empty' ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-base text-ink-muted">{view.body.text}</p>
          {view.body.groupPost === null ? null : (
            <GroupPostButton from="my_pets_group_text" texts={view.body.groupPost} />
          )}
        </div>
      ) : (
        <>
          <dl className="flex flex-col gap-3">
            {view.body.rows.map((row) => (
              <div key={row.key} className="flex items-baseline gap-2">
                <dt className="text-base text-ink">{row.label}</dt>
                <dd className="afiche order-first text-2xl text-ink tabular-nums">{row.count}</dd>
              </div>
            ))}
          </dl>
          <RequiredLevelLine level={view.body.level.level} text={view.body.level.text} />
        </>
      )}
    </section>
  )
}

/** El título y desde cuándo: el mismo arriba de los números, del vacío y del error. */
export function PetStatsHeading({
  id,
  title,
  since,
}: {
  id: string
  title: string
  since?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={id} className="text-xl font-bold break-words text-ink">
        {title}
      </h2>
      {since === undefined ? null : <p className="text-sm text-ink-muted">{since}</p>}
    </div>
  )
}
