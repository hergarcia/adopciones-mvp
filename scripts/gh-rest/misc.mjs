import { api, apiAll, passthrough, realGh, setRepo, whoami } from './api.mjs'
import { OUTPUT, REPO, parseFlags } from './args.mjs'
import { output, pick } from './fields.mjs'

const parse = (argv, spec) => {
  const parsed = parseFlags(argv, { ...REPO, ...spec })
  setRepo(parsed.opts.repo)
  return parsed
}

const fieldsOf = (names) => Object.fromEntries(names.map((f) => [f, (x) => x[f]]))

function labelList(argv) {
  const { opts } = parse(argv, { ...OUTPUT, limit: { short: 'L' }, search: { short: 'S' } })
  const term = opts.search?.toLowerCase()
  const labels = apiAll('/labels?per_page=100')
    .map((l) => ({ id: l.node_id, name: l.name, description: l.description ?? '', color: l.color }))
    .filter((l) => !term || `${l.name} ${l.description}`.toLowerCase().includes(term))
    .slice(0, Number(opts.limit ?? 30))
  if (opts.json) {
    const fields = fieldsOf(['id', 'name', 'description', 'color'])
    return output(
      labels.map((l) => pick(l, opts.json, fields)),
      opts.jq,
    )
  }
  for (const l of labels) process.stdout.write(`${l.name}\t${l.description}\t#${l.color}\n`)
  return 0
}

function repoView(argv) {
  const { opts, pos } = parse(argv, OUTPUT)
  setRepo(pos[0])
  const r = api('GET', '')
  const view = {
    name: r.name,
    nameWithOwner: r.full_name,
    owner: { login: r.owner.login },
    url: r.html_url,
    description: r.description ?? '',
    defaultBranchRef: { name: r.default_branch },
    isPrivate: r.private,
    visibility: r.visibility.toUpperCase(),
  }
  if (opts.json) return output(pick(view, opts.json, fieldsOf(Object.keys(view))), opts.jq)
  process.stdout.write(`name:\t${view.nameWithOwner}\ndescription:\t${view.description}\n`)
  return 0
}

// The session proxy authenticates the REST API itself, so gh's own token check says it is invalid.
function authStatus() {
  try {
    const login = whoami()
    process.stdout.write(
      `github.com\n  ✓ Logged in to github.com account ${login} (cloud session proxy; ` +
        'GraphQL is blocked, so issue and pr go through scripts/gh-rest.mjs over REST)\n',
    )
    return 0
  } catch (e) {
    process.stderr.write(`github.com\n  X The GitHub API is not reachable: ${e.message}\n`)
    return 1
  }
}

// Job logs live on a storage host the cloud network refuses; without them, the failing jobs and
// steps name what to reproduce locally with `pnpm verify`.
function runView(argv) {
  if (!argv.includes('--log-failed') && !argv.includes('--log'))
    return passthrough(['run', 'view', ...argv])
  const real = realGh(['run', 'view', ...argv])
  if (real.status === 0) {
    process.stdout.write(real.stdout)
    return 0
  }
  const { opts, pos } = parse(argv, {
    'log-failed': { bool: true },
    log: { bool: true },
    job: { short: 'j' },
  })
  const jobs = apiAll(`/actions/runs/${pos[0]}/jobs?per_page=100`, 'jobs').filter((j) =>
    opts.job ? String(j.id) === opts.job : !opts['log-failed'] || j.conclusion === 'failure',
  )
  const lines = ['The job logs are not reachable from this container. What GitHub reports:']
  for (const job of jobs) {
    lines.push(`job ${job.name} (${job.id}): ${job.conclusion ?? job.status}`)
    for (const step of job.steps ?? []) {
      if (step.conclusion === 'failure') lines.push(`  failed step: ${step.name}`)
    }
    for (const a of apiAll(`/check-runs/${job.id}/annotations?per_page=100`)) {
      lines.push(`  ${a.annotation_level}: ${a.path}:${a.start_line} ${a.message}`)
    }
  }
  lines.push('Reproduce the failing step locally: `pnpm verify` runs the same stages as CI.')
  process.stdout.write(`${lines.join('\n')}\n`)
  return 0
}

export const misc = {
  label: { list: labelList },
  repo: { view: repoView },
  auth: { status: authStatus },
  run: { view: runView },
}
