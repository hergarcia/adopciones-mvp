import { ApplyAction } from '@/components/applications/apply-action'
import { RequiredLevelLine } from '@/components/applications/required-level-line'
import { LinkButton } from '@/components/ui/link-button'
import type { ApplyActionKind } from '@/lib/applications/apply-action'
import { applyPath, myApplicationPath } from '@/lib/applications/paths'
import { LISTING_PATH } from '@/lib/pets/paths'

type Input = {
  code: string
  kind: ApplyActionKind
  myActiveId: string | null
  /** Nulo si la ficha no lo leyó: la adoptada. */
  requiredLevel: 1 | 2 | null
  adopted: boolean
  isOwner: boolean
  /** Ya traducidos. */
  texts: { apply: string; viewMine: string; requiredLevel: string; toListing: string }
}

// Lo que la ficha ofrece para solicitar, decidido una vez (docs/10 ApplyAction): `sticky` va en la
// tira fija de `PetSheet` y `aside` entre las demás acciones, o nulos si no hay nada. La línea del
// nivel 2 va con «Quiero adoptar»; sin esa acción —la ficha propia— va entre las demás, para que
// quien publicó vea lo que eligió en «Quién puede solicitar» (US3-AS1). La adoptada, para quien no
// la publicó, lleva al listado (FR-010).
export function petApplyAction({
  code,
  kind,
  myActiveId,
  requiredLevel,
  adopted,
  isOwner,
  texts,
}: Input): { sticky: React.ReactNode; aside: React.ReactNode } {
  const line = requiredLevel === 2 ? <RequiredLevelLine text={texts.requiredLevel} /> : null
  const toListing = adopted && !isOwner
  if (kind === 'none') {
    return {
      sticky: toListing ? (
        <LinkButton href={LISTING_PATH} variant="tirita" size="lg" className="md:w-auto">
          {texts.toListing}
        </LinkButton>
      ) : null,
      aside: line,
    }
  }
  return {
    sticky: (
      <>
        {line}
        <ApplyAction
          kind={kind}
          href={myActiveId === null ? applyPath(code) : myApplicationPath(myActiveId)}
          texts={{ apply: texts.apply, viewMine: texts.viewMine }}
        />
      </>
    ),
    aside: null,
  }
}
