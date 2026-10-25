import { describe, expect, it } from 'vitest'
import {
  keepsJsonField,
  needsApproval,
  onlyAddsLines,
  onlyBumpsActions,
  ruleFor,
} from './rules.mjs'

describe('qué juzga a los agentes', () => {
  it('un archivo exacto de la lista', () => {
    expect(ruleFor('CLAUDE.md')?.path).toBe('CLAUDE.md')
    expect(ruleFor('stryker.config.mjs')?.path).toBe('stryker.config.mjs')
  })

  it('todo lo que cuelga de una carpeta de la lista, y la carpeta misma', () => {
    expect(ruleFor('.claude/agents/code-reviewer.md')?.path).toBe('.claude/')
    expect(ruleFor('tests/gates/fixtures/x.tsx')?.path).toBe('tests/gates/')
    expect(ruleFor('.claude')?.path).toBe('.claude/')
  })

  it('sin importar mayúsculas, barras invertidas ni ./ adelante', () => {
    expect(ruleFor('claude.md')?.path).toBe('CLAUDE.md')
    expect(ruleFor('.claude\\hooks\\guard-git.mjs')?.path).toBe('.claude/')
    expect(ruleFor('./scripts/verify.mjs')?.path).toBe('scripts/verify.mjs')
  })

  it('lo que no está en la lista no juzga a nadie', () => {
    expect(ruleFor('src/lib/config.ts')).toBeUndefined()
    expect(ruleFor('scripts/walk.mjs')).toBeUndefined()
    expect(ruleFor('docs/known-limitations.md')).toBeUndefined()
    expect(ruleFor('.claudeignore')).toBeUndefined()
    expect(ruleFor('xCLAUDE.md')).toBeUndefined()
  })
})

describe('el criterio solo crece', () => {
  it('agregar líneas al final o en el medio pasa', () => {
    expect(onlyAddsLines('a\nb\n', 'a\nb\nc\n')).toBe(true)
    expect(onlyAddsLines('a\nb\n', 'a\nnueva\nb\n')).toBe(true)
  })

  it('un archivo nuevo pasa', () => {
    expect(onlyAddsLines(null, 'a\n')).toBe(true)
  })

  it('borrar o cambiar una línea no pasa', () => {
    expect(onlyAddsLines('a\nb\n', 'a\n')).toBe(false)
    expect(onlyAddsLines('a\nb\n', 'a\nB\n')).toBe(false)
    expect(onlyAddsLines('a\nb\n', 'b\na\n')).toBe(false)
  })

  it('borrar el archivo no pasa', () => {
    expect(onlyAddsLines('a\n', null)).toBe(false)
  })

  it('el fin de línea de Windows no cuenta como cambio', () => {
    expect(onlyAddsLines('a\nb\n', 'a\r\nb\r\nc\r\n')).toBe(true)
  })
})
describe('las compuertas del package.json', () => {
  const keeps = keepsJsonField('scripts')
  const pkg = (scripts, deps = { next: '16.0.0' }) =>
    JSON.stringify({ scripts, dependencies: deps })

  it('cambiar una dependencia pasa', () => {
    expect(
      keeps(pkg({ test: 'vitest run' }), pkg({ test: 'vitest run' }, { next: '16.1.0' })),
    ).toBe(true)
  })

  it('reordenar los scripts pasa', () => {
    expect(keeps(pkg({ a: '1', b: '2' }), pkg({ b: '2', a: '1' }))).toBe(true)
  })

  it('cambiar, agregar o sacar un script no pasa', () => {
    expect(keeps(pkg({ test: 'vitest run' }), pkg({ test: 'vitest run --bail 0' }))).toBe(false)
    expect(keeps(pkg({ test: 'vitest run' }), pkg({ test: 'vitest run', x: 'y' }))).toBe(false)
    expect(keeps(pkg({ test: 'vitest run', x: 'y' }), pkg({ test: 'vitest run' }))).toBe(false)
  })

  it('un JSON roto o un archivo borrado no pasa', () => {
    expect(keeps(pkg({ a: '1' }), '{ roto')).toBe(false)
    expect(keeps(pkg({ a: '1' }), null)).toBe(false)
  })

  it('un package.json nuevo con scripts no pasa; sin scripts, sí', () => {
    expect(keeps(null, pkg({ a: '1' }))).toBe(false)
    expect(keeps(null, JSON.stringify({ name: 'x' }))).toBe(true)
  })
})

describe('los workflows de CI', () => {
  const ci = (checkout, run = 'pnpm verify') =>
    `jobs:\n  ci:\n    steps:\n      - uses: actions/checkout@${checkout}\n      - run: ${run}\n`

  it('subir la versión de una action pasa, con comentario o sin él', () => {
    expect(onlyBumpsActions(ci('v7'), ci('v8'))).toBe(true)
    expect(onlyBumpsActions(ci('v7'), ci('abc123 # v8'))).toBe(true)
  })

  it('cambiar un paso no pasa', () => {
    expect(onlyBumpsActions(ci('v7'), ci('v7', 'echo ok'))).toBe(false)
  })

  it('cambiar la action por otra no pasa', () => {
    expect(onlyBumpsActions(ci('v7'), ci('v7').replace('actions/checkout', 'evil/checkout'))).toBe(
      false,
    )
  })

  it('agregar o sacar líneas no pasa', () => {
    expect(onlyBumpsActions(ci('v7'), `${ci('v7')}      - run: echo\n`)).toBe(false)
  })

  it('un workflow nuevo o borrado no pasa', () => {
    expect(onlyBumpsActions(null, ci('v7'))).toBe(false)
    expect(onlyBumpsActions(ci('v7'), null)).toBe(false)
  })
})

describe('cuándo hace falta la aprobación', () => {
  it('cualquier cambio a un archivo sin excepción', () => {
    expect(needsApproval('stryker.config.mjs', 'a', 'b')).toBe(
      'stryker.config.mjs — juzga a los agentes',
    )
    expect(needsApproval('.claude/agents/nuevo.md', null, 'x')).not.toBeNull()
    expect(needsApproval('CLAUDE.md', 'x', null)).not.toBeNull()
  })

  it('un cambio que su excepción permite no la necesita', () => {
    expect(needsApproval('docs/11-criterio.md', 'a\n', 'a\nb\n')).toBeNull()
  })

  it('un cambio que su excepción no permite dice por qué', () => {
    expect(needsApproval('docs/11-criterio.md', 'a\nb\n', 'a\n')).toBe(
      'docs/11-criterio.md — se le agregan líneas; borrar o cambiar una necesita aprobación',
    )
  })

  it('sin cambio, o fuera de la lista, no la necesita', () => {
    expect(needsApproval('CLAUDE.md', 'x', 'x')).toBeNull()
    expect(needsApproval('src/app/page.tsx', 'a', 'b')).toBeNull()
  })
})
