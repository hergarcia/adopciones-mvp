import { ApiError, api, currentBranch, ensureLabels, readBody } from './api.mjs'
import { BODY, UsageError, splitList } from './args.mjs'
import { editIssue } from './edit.mjs'
import { headPulls, parse } from './pr-ref.mjs'

export function create(argv) {
  const { opts } = parse(argv, {
    ...BODY,
    title: { short: 't' },
    base: { short: 'B' },
    head: { short: 'H' },
    draft: { short: 'd', bool: true },
    label: { short: 'l', multi: true },
    milestone: { short: 'm' },
    assignee: { short: 'a', multi: true },
    reviewer: { short: 'r', multi: true },
  })
  if (!opts.title) throw new UsageError('must provide `--title` when not running interactively')
  const head = opts.head ?? currentBranch()
  const base = opts.base ?? api('GET', '').default_branch
  const labels = splitList(opts.label)
  ensureLabels(labels)
  let pr
  try {
    pr = api('POST', '/pulls', {
      title: opts.title,
      body: readBody(opts) ?? '',
      head,
      base,
      draft: Boolean(opts.draft),
    })
  } catch (e) {
    const existing = e instanceof ApiError && e.status === 422 && headPulls(head, 'open')[0]
    if (!existing) throw e
    throw new UsageError(
      `a pull request for branch "${head}" into branch "${base}" already exists:\n${existing.html_url}`,
    )
  }
  editIssue(pr.number, {
    'add-label': labels,
    milestone: opts.milestone,
    'add-assignee': opts.assignee,
  })
  const reviewers = splitList(opts.reviewer)
  if (reviewers.length) api('POST', `/pulls/${pr.number}/requested_reviewers`, { reviewers })
  return 0
}
