export class UsageError extends Error {}

// gh-style flags: `--name value`, `--name=value`, `-x value` and booleans. An unknown flag fails
// loudly: silently dropping it would turn a command into a different one.
export function parseFlags(argv, spec) {
  const short = Object.fromEntries(
    Object.entries(spec)
      .filter(([, s]) => s.short)
      .map(([name, s]) => [s.short, name]),
  )
  const opts = {}
  const pos = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--') {
      pos.push(...argv.slice(i + 1))
      break
    }
    let name
    let inline
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      name = eq === -1 ? arg.slice(2) : arg.slice(2, eq)
      inline = eq === -1 ? undefined : arg.slice(eq + 1)
    } else if (/^-[a-zA-Z]/.test(arg)) {
      name = short[arg[1]]
      if (!name) throw new UsageError(`unknown shorthand flag: '${arg[1]}' in ${arg}`)
      if (arg.length > 2) inline = arg.slice(2).replace(/^=/, '')
    } else {
      pos.push(arg)
      continue
    }
    const s = spec[name]
    if (!s) throw new UsageError(`unknown flag: --${name}`)
    let value
    if (s.bool) value = inline === undefined ? true : inline !== 'false'
    else {
      value = inline ?? argv[++i]
      if (value === undefined) throw new UsageError(`flag needs an argument: --${name}`)
    }
    if (s.multi) (opts[name] ??= []).push(value)
    else opts[name] = value
  }
  return { opts, pos }
}

export const splitList = (values) =>
  (values ?? [])
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean)

export const REPO = { repo: { short: 'R' } }
export const OUTPUT = { json: {}, jq: { short: 'q' } }
export const BODY = { body: { short: 'b' }, 'body-file': { short: 'F' } }
