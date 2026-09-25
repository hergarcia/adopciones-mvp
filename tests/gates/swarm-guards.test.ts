// Los frenos del enjambre (docs/09 §Las reglas no se tocan solas) se ven fallar corriendo los hooks
// reales como los corre Claude Code: el JSON de la llamada por stdin, y exit 2 cuando bloquean.
// Sin SWARM=1 no frenan nada: las sesiones de Hernán cambian las reglas con su aprobación.
import { spawnSync, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const REPO = resolve(import.meta.dirname, '../..')
const GUARD_RULES = join(REPO, '.claude/hooks/guard-rules.mjs')
const GUARD_GIT = join(REPO, '.claude/hooks/guard-git.mjs')

function run(hook: string, payload: object, swarm: boolean) {
  const env = { ...process.env }
  delete env.SWARM
  if (swarm) env.SWARM = '1'
  const r = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ cwd: REPO, ...payload }),
    encoding: 'utf8',
    env,
  })
  return { code: r.status, stderr: r.stderr }
}

const edit = (file: string, from: string, to: string) => ({
  tool_name: 'Edit',
  tool_input: { file_path: join(REPO, file), old_string: from, new_string: to },
})
const bash = (command: string, cwd = REPO) => ({ cwd, tool_name: 'Bash', tool_input: { command } })

describe('el enjambre no cambia lo que lo juzga', () => {
  it('un Edit sobre una regla se bloquea en el enjambre y pasa fuera de él', () => {
    const change = edit('CLAUDE.md', '# adopciones-mvp', '# otra cosa')
    const blocked = run(GUARD_RULES, change, true)
    expect(blocked.code).toBe(2)
    expect(blocked.stderr).toContain('CLAUDE.md — juzga a los agentes')
    expect(run(GUARD_RULES, change, false).code).toBe(0)
  })

  it('un Write que baja el umbral de mutación se bloquea', () => {
    const write = {
      tool_name: 'Write',
      tool_input: { file_path: join(REPO, 'stryker.config.mjs'), content: 'export default {}\n' },
    }
    expect(run(GUARD_RULES, write, true).code).toBe(2)
  })

  it('un Edit fuera de la lista pasa', () => {
    expect(run(GUARD_RULES, edit('src/lib/config.ts', 'APP_NAME', 'APP_NAME'), true).code).toBe(0)
  })

  it('sed -i sobre una compuerta se bloquea; leerla, no', () => {
    expect(run(GUARD_RULES, bash("sed -i 's/100/80/' stryker.config.mjs"), true).code).toBe(2)
    expect(run(GUARD_RULES, bash('sed -n 1,20p stryker.config.mjs'), true).code).toBe(0)
  })
})

describe('lo que se escapó se frena al hacer commit', () => {
  const dir = mkdtempSync(join(tmpdir(), 'swarm-guard-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
  git('init', '-q')
  git('config', 'user.email', 'test@example.test')
  git('config', 'user.name', 'test')
  git('config', 'core.autocrlf', 'false')
  writeFileSync(join(dir, 'CLAUDE.md'), 'regla\n')
  writeFileSync(join(dir, 'notas.md'), 'a\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'base')
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('un commit con una regla cambiada en el árbol de trabajo se bloquea', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), 'regla más floja\n')
    expect(run(GUARD_RULES, bash('git commit -am x', dir), true).code).toBe(2)
    git('checkout', 'HEAD', '--', 'CLAUDE.md')
  })

  it('un cambio que solo está staged también', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), 'regla más floja\n')
    git('add', 'CLAUDE.md')
    writeFileSync(join(dir, 'CLAUDE.md'), 'regla\n')
    expect(run(GUARD_RULES, bash('git commit -m x', dir), true).code).toBe(2)
    git('reset', '-q', 'HEAD', '--', 'CLAUDE.md')
  })

  it('un archivo protegido nuevo, que el mismo comando agrega', () => {
    writeFileSync(join(dir, 'tsconfig.json'), '{}\n')
    expect(run(GUARD_RULES, bash('git add -A && git commit -m x', dir), true).code).toBe(2)
    rmSync(join(dir, 'tsconfig.json'))
  })

  it('con git -C desde otro directorio', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), 'regla más floja\n')
    expect(run(GUARD_RULES, bash(`git -C "${dir}" commit -am x`), true).code).toBe(2)
    git('checkout', 'HEAD', '--', 'CLAUDE.md')
  })

  it('un commit que no toca reglas pasa', () => {
    writeFileSync(join(dir, 'notas.md'), 'b\n')
    expect(run(GUARD_RULES, bash('git add -A && git commit -m x', dir), true).code).toBe(0)
  })
})

describe('las etiquetas del veto y la aprobación son de Hernán', () => {
  it('el enjambre no saca `lista`', () => {
    const veto = bash('gh issue edit 11 --remove-label lista')
    expect(run(GUARD_GIT, veto, true).code).toBe(2)
    expect(run(GUARD_GIT, veto, false).code).toBe(0)
  })

  it('el enjambre no se pone `reglas-aprobadas`, ni al editar ni al crear el PR', () => {
    expect(run(GUARD_GIT, bash('gh pr edit 30 --add-label reglas-aprobadas'), true).code).toBe(2)
    expect(run(GUARD_GIT, bash('gh pr create -t x -b y --label reglas-aprobadas'), true).code).toBe(
      2,
    )
  })

  it('pasar un seguimiento a `lista` no es sacarle `lista`', () => {
    const promote = bash('gh issue edit 25 --remove-label seguimiento --add-label lista')
    expect(run(GUARD_GIT, promote, true).code).toBe(0)
    expect(run(GUARD_GIT, bash('gh issue edit 25 --remove-label "x,lista"'), true).code).toBe(2)
  })

  it('ni las toca por la API', () => {
    expect(run(GUARD_GIT, bash('gh api repos/o/r/issues/11/labels -f labels[]=x'), true).code).toBe(
      2,
    )
  })

  it('poner `lista` sí puede', () => {
    expect(run(GUARD_GIT, bash('gh issue edit 11 --add-label lista'), true).code).toBe(0)
  })
})
