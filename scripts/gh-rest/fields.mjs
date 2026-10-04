import { spawnSync } from 'node:child_process'
import { api, apiAll } from './api.mjs'
import { UsageError } from './args.mjs'
import { rollup } from './rollup.mjs'

// The shapes `gh --json` gives through GraphQL, rebuilt from REST.
const up = (v) => (v ? String(v).toUpperCase() : '')

export const actor = (u) => {
  if (!u) return null
  if (u.type === 'Bot') return { login: `app/${u.login.replace(/\[bot\]$/, '')}`, is_bot: true }
  return { login: u.login, is_bot: false }
}

const label = (l) => ({
  id: l.node_id,
  name: l.name,
  description: l.description ?? '',
  color: l.color,
})

const milestone = (m) =>
  m ? { number: m.number, title: m.title, description: m.description ?? '', dueOn: m.due_on } : null

const comment = (c) => ({
  id: c.node_id,
  author: actor(c.user),
  authorAssociation: c.author_association,
  body: c.body,
  createdAt: c.created_at,
  url: c.html_url,
})

const common = {
  assignees: (x) => x.assignees.map(actor),
  author: (x) => actor(x.user),
  body: (x) => x.body ?? '',
  closed: (x) => x.state === 'closed',
  closedAt: (x) => x.closed_at,
  comments: (x) => apiAll(`/issues/${x.number}/comments?per_page=100`).map(comment),
  createdAt: (x) => x.created_at,
  id: (x) => x.node_id,
  labels: (x) => x.labels.map(label),
  milestone: (x) => milestone(x.milestone),
  number: (x) => x.number,
  title: (x) => x.title,
  updatedAt: (x) => x.updated_at,
  url: (x) => x.html_url,
}

export const issueFields = {
  ...common,
  state: (i) => up(i.state),
  stateReason: (i) => up(i.state_reason),
}

const commit = (c) => {
  const [headline, ...rest] = c.commit.message.split('\n')
  return {
    oid: c.sha,
    messageHeadline: headline,
    messageBody: rest.join('\n').trim(),
    committedDate: c.commit.committer.date,
    authors: [
      { login: c.author?.login ?? '', name: c.commit.author.name, email: c.commit.author.email },
    ],
  }
}

const mergeable = (p) => {
  if (p.mergeable === true) return 'MERGEABLE'
  return p.mergeable === false ? 'CONFLICTING' : 'UNKNOWN'
}

export const prFields = {
  ...common,
  state: (p) => (p.merged_at ? 'MERGED' : up(p.state)),
  isDraft: (p) => p.draft,
  baseRefName: (p) => p.base.ref,
  headRefName: (p) => p.head.ref,
  headRefOid: (p) => p.head.sha,
  headRepositoryOwner: (p) => ({ login: p.head.repo?.owner.login ?? '' }),
  isCrossRepository: (p) => p.head.repo?.full_name !== p.base.repo.full_name,
  mergeable,
  mergeStateStatus: (p) => up(p.mergeable_state) || 'UNKNOWN',
  mergedAt: (p) => p.merged_at,
  mergedBy: (p) => actor(p.merged_by),
  mergeCommit: (p) => (p.merged_at ? { oid: p.merge_commit_sha } : null),
  additions: (p) => p.additions,
  deletions: (p) => p.deletions,
  changedFiles: (p) => p.changed_files,
  commits: (p) => apiAll(`/pulls/${p.number}/commits?per_page=100`).map(commit),
  files: (p) =>
    apiAll(`/pulls/${p.number}/files?per_page=100`).map((f) => ({
      path: f.filename,
      additions: f.additions,
      deletions: f.deletions,
    })),
  reviews: (p) =>
    apiAll(`/pulls/${p.number}/reviews?per_page=100`).map((r) => ({
      author: actor(r.user),
      state: r.state,
      body: r.body,
      submittedAt: r.submitted_at,
    })),
  statusCheckRollup: (p) => rollup(p.head.sha),
}

// The list endpoint leaves these out; asking for one fetches each pull request in full.
export const PR_DETAIL = new Set([
  'mergeable',
  'mergeStateStatus',
  'additions',
  'deletions',
  'changedFiles',
  'mergedBy',
])

export const fullPr = (p) => api('GET', `/pulls/${p.number}`)

export const splitFields = (json) =>
  String(json)
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)

export function pick(item, json, fields) {
  const names = splitFields(json)
  const unknown = names.find((n) => !fields[n])
  if (unknown) {
    const list = Object.keys(fields).sort().join('\n  ')
    throw new UsageError(`Unknown JSON field: "${unknown}"\nAvailable fields:\n  ${list}`)
  }
  return Object.fromEntries(names.map((n) => [n, fields[n](item)]))
}

export function output(data, jq) {
  const text = JSON.stringify(data, null, 2)
  if (!jq) {
    process.stdout.write(`${text}\n`)
    return 0
  }
  const r = spawnSync('jq', ['-r', jq], { input: text, encoding: 'utf8' })
  process.stdout.write(r.stdout ?? '')
  process.stderr.write(r.stderr ?? '')
  return r.status ?? 1
}
