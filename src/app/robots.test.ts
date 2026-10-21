// Covers: FR-021, FR-022, SC-007 (#201: los lectores de vista previa pueden armar la tarjeta de
// «Nosotros», y nada se indexa todavía)
import { describe, expect, it, vi } from 'vitest'
import { LINK_PREVIEW_AGENTS } from '@/lib/analytics/link-preview'
import { LISTING_PATH } from '@/lib/pets/paths'
import { QUESTIONS_PATH } from '@/lib/questions/paths'
import robots from './robots'

vi.mock('@/lib/config', async (original) => ({
  ...(await original<typeof import('@/lib/config')>()),
  INDEXING_ENABLED: false,
}))

describe('robots', () => {
  it('sin indexación, todo cerrado y los lectores de vista previa leen lo que se comparte', () => {
    expect(robots().rules).toEqual([
      { userAgent: '*', disallow: '/' },
      {
        userAgent: [...LINK_PREVIEW_AGENTS],
        allow: [LISTING_PATH, '/$', '/imagen', QUESTIONS_PATH, '/nosotros'],
        disallow: '/',
      },
    ])
  })
})
