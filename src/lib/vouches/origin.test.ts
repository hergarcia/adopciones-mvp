import { describe, expect, it } from 'vitest'
import { vouchOrigin } from './origin'

// Covers: #261, el aval dado desde el seguimiento se cuenta con su propio origen. Si se confunde,
// la medición no puede decir si los rescatistas avalan cuando se los invita.
describe('el origen de un aval', () => {
  it.each(['profile', 'follow_up'] as const)('%s se cuenta tal cual', (origin) => {
    expect(vouchOrigin(origin)).toBe(origin)
  })

  it.each([undefined, null, '', 'pet', 'FOLLOW_UP', 1])('%o cuenta como el perfil', (value) => {
    expect(vouchOrigin(value)).toBe('profile')
  })
})
