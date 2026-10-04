import { ApiError, api, assignees, ensureLabels, milestoneNumber, readBody } from './api.mjs'
import { BODY, REPO, splitList } from './args.mjs'

export const EDIT = {
  ...REPO,
  ...BODY,
  title: { short: 't' },
  'add-label': { multi: true },
  'remove-label': { multi: true },
  milestone: { short: 'm' },
  'remove-milestone': { bool: true },
  'add-assignee': { multi: true },
  'remove-assignee': { multi: true },
}

// Issues and pull requests share the issues endpoint for everything gh edits but the base branch.
export function editIssue(number, opts) {
  const patch = {}
  if (opts.title !== undefined) patch.title = opts.title
  const body = readBody(opts)
  if (body !== undefined) patch.body = body
  if (opts.milestone !== undefined) patch.milestone = milestoneNumber(opts.milestone)
  if (opts['remove-milestone']) patch.milestone = null
  const add = splitList(opts['add-label'])
  ensureLabels(add)
  let issue = Object.keys(patch).length ? api('PATCH', `/issues/${number}`, patch) : null
  if (add.length) api('POST', `/issues/${number}/labels`, { labels: add })
  for (const name of splitList(opts['remove-label'])) {
    try {
      api('DELETE', `/issues/${number}/labels/${encodeURIComponent(name)}`)
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e
    }
  }
  const addAssignees = assignees(splitList(opts['add-assignee']))
  if (addAssignees.length) api('POST', `/issues/${number}/assignees`, { assignees: addAssignees })
  const removeAssignees = assignees(splitList(opts['remove-assignee']))
  if (removeAssignees.length) {
    api('DELETE', `/issues/${number}/assignees`, { assignees: removeAssignees })
  }
  issue ??= api('GET', `/issues/${number}`)
  process.stdout.write(`${issue.html_url}\n`)
}

export function comment(number, opts) {
  const body = readBody(opts)
  if (!body) throw new Error('the comment body is empty: pass --body or --body-file')
  const created = api('POST', `/issues/${number}/comments`, { body })
  process.stdout.write(`${created.html_url}\n`)
}

export function setState(number, state, opts, kind) {
  if (opts.comment) api('POST', `/issues/${number}/comments`, { body: opts.comment })
  const patch = { state }
  if (kind === 'issue' && state === 'closed' && opts.reason) {
    patch.state_reason = opts.reason.replace(/\s+/g, '_')
  }
  const path = kind === 'pr' ? `/pulls/${number}` : `/issues/${number}`
  const item = api('PATCH', path, patch)
  const verb = state === 'closed' ? 'Closed' : 'Reopened'
  const noun = kind === 'pr' ? 'pull request' : 'issue'
  process.stderr.write(`✓ ${verb} ${noun} #${number} (${item.title})\n`)
}
