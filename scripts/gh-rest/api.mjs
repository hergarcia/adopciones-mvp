import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { UsageError } from './args.mjs'

const REAL = process.env.GH_REAL

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function realGh(args, options = {}) {
  if (!REAL) throw new UsageError('GH_REAL is not set; install the shim with scripts/cloud-up.sh')
  const r = spawnSync(REAL, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...options })
  if (r.error) throw r.error
  return r
}

export const passthrough = (args) => realGh(args, { stdio: 'inherit' }).status ?? 1

let repo = '{owner}/{repo}'
export const setRepo = (value) => {
  if (value) repo = value
}
const repoPath = (path) => `repos/${repo}${path}`

function call(args, input) {
  const r = realGh(['api', ...args], input === undefined ? {} : { input })
  if (r.status !== 0) {
    const status = Number(/\(HTTP (\d+)\)/.exec(r.stderr)?.[1] ?? 0)
    throw new ApiError(
      r.stderr.replace(/^gh: /, '').trim() || `gh api ${args.at(-1)} failed`,
      status,
    )
  }
  return r.stdout.trim() ? JSON.parse(r.stdout) : null
}

export function api(method, path, body) {
  const args = ['-X', method, repoPath(path)]
  if (body === undefined) return call(args)
  return call([...args, '--input', '-'], JSON.stringify(body))
}

export function apiAll(path, key) {
  const pages = call(['--paginate', '--slurp', repoPath(path)])
  return pages.flatMap((page) => (key ? page[key] : page))
}

export const whoami = () => call(['user']).login

let fullName
export const repoFullName = () => (fullName ??= api('GET', '').full_name)

export function git(args, options = {}) {
  const r = spawnSync('git', args, { encoding: 'utf8', ...options })
  return { status: r.status ?? 1, out: (r.stdout ?? '').trim() }
}

export const currentBranch = () => git(['rev-parse', '--abbrev-ref', 'HEAD']).out

export const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

export function readBody(opts) {
  if (opts.body !== undefined) return opts.body
  const file = opts['body-file']
  if (file === undefined) return undefined
  return readFileSync(file === '-' ? 0 : file, 'utf8')
}

export const refNumber = (ref) => {
  const m = /^#?(\d+)$/.exec(ref ?? '') ?? /\/(?:issues|pull)\/(\d+)/.exec(ref ?? '')
  return m ? Number(m[1]) : null
}

export function ensureLabels(names) {
  if (names.length === 0) return
  const known = new Set(apiAll('/labels?per_page=100').map((l) => l.name))
  const missing = names.find((n) => !known.has(n))
  if (missing) throw new UsageError(`'${missing}' not found`)
}

export function milestoneNumber(title) {
  const all = apiAll('/milestones?state=all&per_page=100')
  const m = all.find((x) => x.title === title || String(x.number) === title)
  if (!m) throw new UsageError(`'${title}' not found`)
  return m.number
}

export const assignees = (names) => names.map((n) => (n === '@me' ? whoami() : n))
