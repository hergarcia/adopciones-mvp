// Lo que juzga a los agentes y cuándo un cambio a eso necesita la etiqueta `reglas-aprobadas`
// (docs/09 §Las reglas no se tocan solas). Es la lista completa: la leen el hook de la sesión del
// enjambre y el check de CI, y está en su propia lista.

const lines = (text) => text.replaceAll('\r\n', '\n').split('\n')

export function onlyAddsLines(before, after) {
  if (after === null) return false
  if (before === null) return true
  const kept = lines(before)
  let matched = 0
  for (const line of lines(after)) {
    if (matched < kept.length && line === kept[matched]) matched++
  }
  return matched === kept.length
}

function section(text, heading) {
  const all = lines(text)
  const start = all.findIndex((line) => line.startsWith(heading))
  if (start < 0) return null
  const level = heading.indexOf(' ')
  const next = all.findIndex((line, i) => {
    const hashes = /^(#+)\s/.exec(line)
    return i > start && hashes !== null && hashes[1].length <= level
  })
  return all
    .slice(start, next < 0 ? undefined : next)
    .join('\n')
    .trimEnd()
}

export const keepsSection = (heading) => (before, after) =>
  after !== null && section(before ?? '', heading) === section(after, heading)

const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)))
      : v,
  )

export const keepsJsonField = (field) => (before, after) => {
  if (after === null) return false
  try {
    const was = before === null ? undefined : JSON.parse(before)[field]
    return canonical(was) === canonical(JSON.parse(after)[field])
  } catch {
    return false
  }
}

// Renovate sube la versión de las actions; eso no afloja ninguna compuerta.
const USES = /^(\s*-?\s*uses:\s*[^@\s]+)@\S+/

export function onlyBumpsActions(before, after) {
  if (before === null || after === null) return false
  const was = lines(before)
  const is = lines(after)
  if (was.length !== is.length) return false
  return was.every((line, i) => {
    if (line === is[i]) return true
    const a = USES.exec(line)
    const b = USES.exec(is[i])
    return a !== null && b !== null && a[1] === b[1]
  })
}

export const PROTECTED = [
  { path: 'CLAUDE.md' },
  { path: '.specify/' },
  { path: '.claude/' },
  { path: 'docs/09-flujo-de-trabajo.md' },
  {
    path: 'docs/11-criterio.md',
    allows: onlyAddsLines,
    hint: 'se le agregan líneas; borrar o cambiar una necesita aprobación',
  },
  {
    path: 'docs/03-mvp-features.md',
    allows: keepsSection('## Fuera del MVP'),
    hint: 'la tabla «Fuera del MVP» la cambia solo Hernán',
  },
  {
    path: 'package.json',
    allows: keepsJsonField('scripts'),
    hint: 'el campo `scripts` define las compuertas',
  },
  {
    path: '.github/workflows/',
    allows: onlyBumpsActions,
    hint: 'sin aprobación solo cambia la versión de una action',
  },
  { path: '.lighthouserc.json' },
  { path: '.oxlintrc.json' },
  { path: '.prettierignore' },
  { path: '.prettierrc' },
  { path: 'lefthook.yml' },
  { path: 'playwright.config.ts' },
  { path: 'stryker.config.mjs' },
  { path: 'tsconfig.json' },
  { path: 'vitest.config.ts' },
  { path: 'scripts/check-protected.mjs' },
  { path: 'scripts/check-service-key.mjs' },
  { path: 'scripts/e2e.mjs' },
  { path: 'scripts/mutation.mjs' },
  { path: 'scripts/protected/' },
  { path: 'scripts/service-key/' },
  { path: 'scripts/verify.mjs' },
  { path: 'tests/gates/' },
  { path: 'tests/setup/' },
  { path: 'tools/oxlint-rules/' },
]

// Mayúsculas y minúsculas dan igual: en Windows, `claude.md` es el mismo archivo.
export function ruleFor(file) {
  const f = file.replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase()
  return PROTECTED.find(({ path }) => {
    const p = path.toLowerCase()
    return p.endsWith('/') ? f.startsWith(p) || f === p.slice(0, -1) : f === p
  })
}

// Devuelve por qué el cambio necesita aprobación, o null si no la necesita.
export function needsApproval(file, before, after) {
  const rule = ruleFor(file)
  if (!rule || before === after) return null
  if (rule.allows?.(before, after)) return null
  return rule.hint ? `${file} — ${rule.hint}` : `${file} — juzga a los agentes`
}
