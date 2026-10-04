import { api, apiAll, assignees } from './api.mjs'
import { BODY, OUTPUT, splitList } from './args.mjs'
import { EDIT, comment, editIssue, setState } from './edit.mjs'
import { PR_DETAIL, actor, fullPr, output, pick, prFields, splitFields } from './fields.mjs'
import { create } from './pr-create.mjs'
import { checkout, checks, merge } from './pr-merge.mjs'
import { headPulls, parse, resolvePr, withMergeable } from './pr-ref.mjs'
import { matches, parseSearch } from './search.mjs'

const stateOf = (p) => (p.merged_at ? 'MERGED' : p.state.toUpperCase())
const names = (list) => list.map((x) => x.name ?? x.login).join(', ')

function view(argv) {
  const { opts, pos } = parse(argv, { ...OUTPUT, comments: { short: 'c', bool: true } })
  let pr = resolvePr(pos[0])
  if (opts.json) {
    if (splitFields(opts.json).some((f) => f === 'mergeable' || f === 'mergeStateStatus')) {
      pr = withMergeable(pr)
    }
    return output(pick(pr, opts.json, prFields), opts.jq)
  }
  const lines = [
    `title:\t${pr.title}`,
    `state:\t${stateOf(pr)}${pr.draft ? ' (draft)' : ''}`,
    `author:\t${pr.user.login}`,
    `labels:\t${names(pr.labels)}`,
    `milestone:\t${pr.milestone?.title ?? ''}`,
    `number:\t${pr.number}`,
    `url:\t${pr.html_url}`,
    `additions:\t${pr.additions}`,
    `deletions:\t${pr.deletions}`,
    `base:\t${pr.base.ref}`,
    `head:\t${pr.head.ref}`,
    '--',
    pr.body ?? '',
  ]
  if (opts.comments) {
    for (const c of prFields.comments(pr)) {
      lines.push(
        '--',
        `author:\t${c.author?.login ?? ''}`,
        `created:\t${c.createdAt}`,
        '--',
        c.body,
      )
    }
  }
  process.stdout.write(`${lines.join('\n')}\n`)
  return 0
}

function listPulls(argv) {
  const { opts } = parse(argv, {
    ...OUTPUT,
    state: { short: 's' },
    limit: { short: 'L' },
    label: { short: 'l', multi: true },
    author: { short: 'A' },
    head: { short: 'H' },
    base: { short: 'B' },
    search: { short: 'S' },
    draft: { short: 'd', bool: true },
  })
  const q = parseSearch(opts.search)
  const state = q.state ?? opts.state ?? 'open'
  const params = new URLSearchParams({ state: state === 'merged' ? 'closed' : state })
  params.set('per_page', '100')
  if (opts.base) params.set('base', opts.base)
  const labels = [...splitList(opts.label), ...q.labels]
  const author = opts.author && assignees([opts.author])[0]
  let pulls = opts.head ? headPulls(opts.head, params.get('state')) : apiAll(`/pulls?${params}`)
  pulls = pulls
    .filter((p) => state !== 'merged' || p.merged_at)
    .filter((p) => !author || p.user.login === author || actor(p.user).login === author)
    .filter((p) => labels.every((l) => p.labels.some((x) => x.name === l)))
    .filter((p) => opts.draft === undefined || p.draft === opts.draft)
    .filter((p) => matches(p, q))
    .slice(0, Number(opts.limit ?? 30))
  if (opts.json) {
    const detail = splitFields(opts.json).some((f) => PR_DETAIL.has(f))
    return output(
      pulls.map((p) => pick(detail ? fullPr(p) : p, opts.json, prFields)),
      opts.jq,
    )
  }
  for (const p of pulls) {
    const row = [p.number, p.title, p.head.ref, stateOf(p), p.created_at]
    process.stdout.write(`${row.join('\t')}\n`)
  }
  return 0
}

function edit(argv) {
  const { opts, pos } = parse(argv, { ...EDIT, base: { short: 'B' } })
  const pr = resolvePr(pos[0])
  if (opts.base) api('PATCH', `/pulls/${pr.number}`, { base: opts.base })
  editIssue(pr.number, opts)
  return 0
}

function ready(argv) {
  const { opts, pos } = parse(argv, { undo: { bool: true } })
  const pr = resolvePr(pos[0])
  api('POST', `/pulls/${pr.number}/ccr/${opts.undo ? 'convert_to_draft' : 'ready_for_review'}`)
  const what = opts.undo ? 'converted to "draft"' : 'marked as "ready for review"'
  process.stderr.write(`✓ Pull request #${pr.number} is ${what}\n`)
  return 0
}

export const pr = {
  view,
  list: listPulls,
  create,
  edit,
  ready,
  merge,
  checks,
  checkout,
  close: (argv) => {
    const { opts, pos } = parse(argv, { comment: { short: 'c' } })
    setState(resolvePr(pos[0]).number, 'closed', opts, 'pr')
    return 0
  },
  reopen: (argv) => {
    const { opts, pos } = parse(argv, { comment: { short: 'c' } })
    setState(resolvePr(pos[0]).number, 'open', opts, 'pr')
    return 0
  },
  comment: (argv) => {
    const { opts, pos } = parse(argv, BODY)
    comment(resolvePr(pos[0]).number, opts)
    return 0
  },
}
