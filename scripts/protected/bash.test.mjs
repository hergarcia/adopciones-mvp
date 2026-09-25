import { describe, expect, it } from 'vitest'
import { isCommit, protectedWrites } from './bash.mjs'

const ROOT = 'C:\\repo'

describe('un comando que escribiría lo protegido', () => {
  it('una redirección a un archivo protegido', () => {
    expect(protectedWrites('echo x > CLAUDE.md', ROOT)).toEqual(['CLAUDE.md'])
    expect(protectedWrites('echo x >> "stryker.config.mjs"', ROOT)).toEqual(['stryker.config.mjs'])
  })

  it('sed -i, prettier --write, cp, rm y git checkout sobre un archivo protegido', () => {
    expect(protectedWrites("sed -i 's/100/80/' stryker.config.mjs", ROOT)).toEqual([
      'stryker.config.mjs',
    ])
    expect(protectedWrites('sed -E -i "s/a/b/" CLAUDE.md', ROOT)).toEqual(['CLAUDE.md'])
    expect(protectedWrites('pnpm exec prettier --write tests/gates/x.test.ts', ROOT)).toEqual([
      'tests/gates/x.test.ts',
    ])
    expect(protectedWrites('rm -rf .claude/agents', ROOT)).toEqual(['.claude/agents'])
    expect(protectedWrites('git checkout main -- tsconfig.json', ROOT)).toEqual(['tsconfig.json'])
  })

  it('con ruta absoluta de Windows o de Git Bash', () => {
    expect(protectedWrites('echo x > C:/repo/CLAUDE.md', ROOT)).toEqual(['CLAUDE.md'])
    expect(protectedWrites('tee /c/repo/lefthook.yml < x', ROOT)).toEqual(['lefthook.yml'])
  })

  it('en cualquier segmento de un comando compuesto', () => {
    expect(protectedWrites('git status && echo x > vitest.config.ts', ROOT)).toEqual([
      'vitest.config.ts',
    ])
  })
})

describe('un comando que solo lee lo protegido', () => {
  it('leer, buscar y correr no escriben', () => {
    expect(protectedWrites('cat CLAUDE.md', ROOT)).toEqual([])
    expect(protectedWrites('grep -n lista CLAUDE.md > /tmp/out', ROOT)).toEqual([])
    expect(protectedWrites('node scripts/verify.mjs 2>&1 | tail -5', ROOT)).toEqual([])
    expect(protectedWrites('sed -n 1,20p stryker.config.mjs', ROOT)).toEqual([])
  })

  it('escribir fuera de la lista no cuenta', () => {
    expect(protectedWrites('echo x > src/lib/config.ts', ROOT)).toEqual([])
    expect(protectedWrites("sed -i 's/a/b/' src/app/page.tsx && cat CLAUDE.md", ROOT)).toEqual([])
  })
})

describe('un commit', () => {
  it('se reconoce solo o en un comando compuesto', () => {
    expect(isCommit('git commit -m "x"')).toBe(true)
    expect(isCommit('git add -A && git commit -q -F -')).toBe(true)
  })

  it('otra cosa no es un commit', () => {
    expect(isCommit('git log --grep commit')).toBe(false)
    expect(isCommit('echo git commit')).toBe(false)
  })
})
