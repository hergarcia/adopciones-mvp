// Covers: historia #294, criterios 1 a 4. Si la salida se equivoca, a quien perdió el animal se le
// esconde el camino de vuelta, o el sitio empuja a pedir otro a quien eligió irse o bloqueó.
import { describe, expect, it } from 'vitest'
import { heldExit } from './held-exit'
import { RECEIVING, type HeldLapseReason, type Receiving } from './types'

const CODE = 'k3x9p2qa7m'

function exitOf(
  lapseReason: HeldLapseReason,
  receiving: Receiving | null,
  code: string | null = CODE,
) {
  return heldExit({ lapseReason, receiving, code })
}

describe('heldExit', () => {
  it.each<HeldLapseReason>(['expired', 'withdrawn', 'not_receiving', 'capped', 'adopted'])(
    'con el animal recibiendo hoy, %s lleva a su ficha',
    (reason) => {
      expect(exitOf(reason, 'yes')).toEqual({ kind: 'pet', href: `/animales/${CODE}` })
    },
  )

  it.each<HeldLapseReason>(['you_blocked', 'suspended'])(
    '%s lleva solo al listado, aunque el animal reciba',
    (reason) => {
      expect(exitOf(reason, 'yes')).toEqual({ kind: 'listing' })
      expect(exitOf(reason, null)).toEqual({ kind: 'listing' })
    },
  )

  it.each<[HeldLapseReason, Receiving | null]>([
    ['adopted', 'closed'],
    ['unpublished', null],
    ['not_receiving', 'unavailable'],
    ['expired', 'closed'],
    ['capped', 'unavailable'],
  ])('%s con el animal sin recibir (%s) ofrece sugeridos', (reason, receiving) => {
    expect(exitOf(reason, receiving)).toEqual({ kind: 'suggestions' })
  })

  it('retirada y con el animal sin recibir lleva solo al listado', () => {
    for (const receiving of [...RECEIVING.filter((one) => one !== 'yes'), null])
      expect(exitOf('withdrawn', receiving)).toEqual({ kind: 'listing' })
  })

  it('sin el código del animal no hay ficha a la que volver', () => {
    expect(exitOf('expired', 'yes', null)).toEqual({ kind: 'suggestions' })
    expect(exitOf('withdrawn', 'yes', null)).toEqual({ kind: 'listing' })
  })
})
