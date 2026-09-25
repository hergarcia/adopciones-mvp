import { describe, expect, it } from 'vitest'
import { commitDir, protectedWrites } from './bash.mjs'

const ROOT = 'C:\\repo'

describe('un comando que escribiría lo protegido', () => {
  it('una redirección a un archivo protegido', () => {
    expect(protectedWrites('echo x > CLAUDE.md', ROOT)).toEqual(['CLAUDE.md'])
    expect(protectedWrites('echo x >> "stryker.config.mjs"', ROOT)).toEqual(['stryker.config.mjs'])
  })

  it('sed -i, prettier --write, cp y rm sobre un archivo protegido', () => {
    expect(protectedWrites("sed -i 's/100/80/' stryker.config.mjs", ROOT)).toEqual([
      'stryker.config.mjs',
    ])
    expect(protectedWrites('sed -E -i "s/a/b/" CLAUDE.md', ROOT)).toEqual(['CLAUDE.md'])
    expect(protectedWrites('pnpm exec prettier --write tests/gates/x.test.ts', ROOT)).toEqual([
      'tests/gates/x.test.ts',
    ])
    expect(protectedWrites('rm -rf .claude/agents', ROOT)).toEqual(['.claude/agents'])
    expect(protectedWrites('cp /tmp/x tsconfig.json', ROOT)).toEqual(['tsconfig.json'])
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

  it('un patrón de búsqueda entre comillas no es un comando que escribe', () => {
    expect(protectedWrites('grep -rn "rm -rf" .claude/', ROOT)).toEqual([])
  })

  it('devolver un archivo a HEAD deshace un cambio; no lo escribe', () => {
    expect(protectedWrites('git checkout HEAD -- stryker.config.mjs', ROOT)).toEqual([])
    expect(protectedWrites('git restore tsconfig.json', ROOT)).toEqual([])
  })

  it('escribir fuera de la lista no cuenta', () => {
    expect(protectedWrites('echo x > src/lib/config.ts', ROOT)).toEqual([])
    expect(protectedWrites("sed -i 's/a/b/' src/app/page.tsx && cat CLAUDE.md", ROOT)).toEqual([])
  })
})

describe('un commit', () => {
  it('se reconoce solo o en un comando compuesto', () => {
    expect(commitDir('git commit -m "x"')).toBe('')
    expect(commitDir('git add -A && git commit -q -F -')).toBe('')
  })

  it('con opciones globales antes, y en el directorio de -C', () => {
    expect(commitDir('git -C ../otro commit -m x')).toBe('../otro')
    expect(commitDir('git -C "C:/repo con espacio" commit -m x')).toBe('C:/repo con espacio')
    expect(commitDir('git -c user.name=x --no-pager commit -m x')).toBe('')
  })

  it('otra cosa no es un commit', () => {
    expect(commitDir('git log --grep commit')).toBeNull()
    expect(commitDir('echo git commit')).toBeNull()
    expect(commitDir('git -C .. status')).toBeNull()
  })
})
