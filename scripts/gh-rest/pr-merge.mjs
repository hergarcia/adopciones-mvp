import { ApiError, api, currentBranch, git, readBody, sleep } from './api.mjs'
import { BODY, OUTPUT, UsageError } from './args.mjs'
import { output, pick } from './fields.mjs'
import { checkRow, rollup } from './rollup.mjs'
import { parse, resolvePr } from './pr-ref.mjs'

export function merge(argv) {
  const { opts, pos } = parse(argv, {
    ...BODY,
    squash: { short: 's', bool: true },
    merge: { short: 'm', bool: true },
    rebase: { short: 'r', bool: true },
    'delete-branch': { short: 'd', bool: true },
    subject: { short: 't' },
    'match-head-commit': {},
  })
  const pr = resolvePr(pos[0])
  if (pr.merged_at) {
    process.stderr.write(`! Pull request #${pr.number} was already merged\n`)
    return 0
  }
  if (pr.draft) throw new UsageError(`Pull request #${pr.number} is still a draft`)
  const method = opts.rebase ? 'rebase' : opts.merge ? 'merge' : 'squash'
  const body = { merge_method: method }
  if (opts.subject) body.commit_title = opts.subject
  const message = readBody(opts)
  if (message !== undefined) body.commit_message = message
  if (opts['match-head-commit']) body.sha = opts['match-head-commit']
  api('PUT', `/pulls/${pr.number}/merge`, body)
  process.stderr.write(`✓ Merged pull request #${pr.number} (${pr.title}) with ${method}\n`)
  if (opts['delete-branch']) deleteBranch(pr)
  return 0
}

// The cloud proxy refuses deleting refs; the merge already landed, so that only leaves a warning.
function deleteBranch(pr) {
  const head = pr.head.ref
  if (pr.head.repo?.full_name === pr.base.repo.full_name) {
    try {
      api('DELETE', `/git/refs/heads/${head}`)
      process.stderr.write(`✓ Deleted remote branch ${head}\n`)
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
      process.stderr.write(`! Remote branch ${head} was not deleted: ${e.message}\n`)
    }
  }
  if (git(['rev-parse', '--verify', '--quiet', `refs/heads/${head}`]).status !== 0) return
  if (currentBranch() === head) {
    git(['checkout', pr.base.ref], { stdio: 'inherit' })
    git(['pull', '--ff-only', 'origin', pr.base.ref], { stdio: 'inherit' })
  }
  git(['branch', '-D', head], { stdio: 'inherit' })
}

export function checkout(argv) {
  const { opts, pos } = parse(argv, { branch: { short: 'b' } })
  const pr = resolvePr(pos[0])
  const local = opts.branch ?? pr.head.ref
  const fetched = git(['fetch', 'origin', pr.head.ref], { stdio: 'inherit' })
  if (fetched.status !== 0) return fetched.status
  const exists = git(['rev-parse', '--verify', '--quiet', `refs/heads/${local}`]).status === 0
  const steps = exists
    ? [
        ['checkout', local],
        ['merge', '--ff-only', `origin/${pr.head.ref}`],
      ]
    : [['checkout', '-b', local, '--track', `origin/${pr.head.ref}`]]
  for (const step of steps) {
    const r = git(step, { stdio: 'inherit' })
    if (r.status !== 0) return r.status
  }
  return 0
}

const failed = (r) => r.bucket === 'fail' || r.bucket === 'cancel'

export function checks(argv) {
  const { opts, pos } = parse(argv, {
    ...OUTPUT,
    watch: { bool: true },
    'fail-fast': { bool: true },
    interval: { short: 'i' },
    required: { bool: true },
  })
  const number = resolvePr(pos[0]).number
  const interval = Number(opts.interval ?? 10) * 1000
  let pr
  let rows
  // Right after a push the checks take a few seconds to register; --watch waits up to 2 minutes.
  for (let waited = 0; ; waited += interval) {
    pr = api('GET', `/pulls/${number}`)
    rows = rollup(pr.head.sha).map(checkRow)
    const pending = rows.length === 0 || rows.some((r) => r.bucket === 'pending')
    if (!opts.watch || !pending) break
    if (opts['fail-fast'] && rows.some(failed)) break
    if (rows.length === 0 && waited >= 120_000) break
    sleep(interval)
  }
  if (opts.json) {
    const code = output(
      rows.map((r) => pick(r, opts.json, CHECK_FIELDS)),
      opts.jq,
    )
    if (code !== 0) return code
  } else if (rows.length === 0) {
    process.stderr.write(`no checks reported on the '${pr.head.ref}' branch\n`)
    return 1
  } else {
    for (const r of rows) {
      process.stdout.write(`${[r.name, r.bucket, r.elapsed, r.link, r.description].join('\t')}\n`)
    }
  }
  if (rows.some(failed)) return 1
  return rows.length === 0 || rows.some((r) => r.bucket === 'pending') ? 8 : 0
}

const CHECK_FIELDS = Object.fromEntries(
  ['name', 'state', 'bucket', 'link', 'description', 'workflow', 'startedAt', 'completedAt'].map(
    (f) => [f, (r) => r[f]],
  ),
)
