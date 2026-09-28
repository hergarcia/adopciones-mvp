import { describe, expect, it } from 'vitest'
import { leavingLoss } from './leaving-loss'

// Covers: FR-007, FR-014, FR-015. Si esto se equivoca, el aviso de salir le dice a la persona que
// pierde lo que no pierde, o la deja irse perdiendo lo que sí.
describe('qué se pierde al salir del perfil sin guardar', () => {
  it('al editar sin tocar nada, nada', () => {
    expect(leavingLoss({ keepsDraft: false, changed: false, photoPicked: false })).toBe('nothing')
  })

  it('al editar con cambios, los cambios: no hay borrador que los guarde', () => {
    expect(leavingLoss({ keepsDraft: false, changed: true, photoPicked: false })).toBe('changes')
  })

  it('al editar con una foto elegida, todos los cambios, no solo la foto', () => {
    expect(leavingLoss({ keepsDraft: false, changed: true, photoPicked: true })).toBe('changes')
  })

  it('en el alta con lo escrito en el borrador, nada: vuelve al volver', () => {
    expect(leavingLoss({ keepsDraft: true, changed: true, photoPicked: false })).toBe('nothing')
  })

  it('en el alta con una foto elegida, solo la foto: el borrador no la guarda', () => {
    expect(leavingLoss({ keepsDraft: true, changed: true, photoPicked: true })).toBe('photo')
  })
})
