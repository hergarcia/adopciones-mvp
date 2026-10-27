import { describe, expect, it } from 'vitest'
import { touchesCode } from './docs-only.mjs'

describe('qué cambio necesita el CI entero', () => {
  it.each([
    'docs/09-flujo-de-trabajo.md',
    'specs/206-camadas/plan.md',
    '.specify/memory/constitution.md',
    '.claude/skills/story-ship/stages/build.md',
    '.claude/agents/product-owner.md',
    '.claude/workflows/director.js',
    'CLAUDE.md',
    '.github/pull_request_template.md',
  ])('%s solo es texto', (file) => {
    expect(touchesCode([file])).toBe(false)
  })

  it.each([
    'src/lib/pets/draft.ts',
    'supabase/migrations/20261026000000_pets.sql',
    'messages/es.json',
    '.claude/hooks/guard-git.mjs',
    '.claude/settings.json',
    '.github/workflows/ci.yml',
    'package.json',
    'tests/e2e/publicar.spec.ts',
  ])('%s es código', (file) => {
    expect(touchesCode([file])).toBe(true)
  })

  it('basta un archivo de código entre textos', () => {
    expect(touchesCode(['docs/03-mvp-features.md', 'src/app/[locale]/page.tsx'])).toBe(true)
  })

  it('sin cambios que leer, corre todo: no se saltea nada por no saber', () => {
    expect(touchesCode([])).toBe(true)
  })
})
