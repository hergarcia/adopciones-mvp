import {
  api,
  apiAll,
  assignees,
  ensureLabels,
  milestoneNumber,
  readBody,
  refNumber,
  setRepo,
} from './api.mjs'
import { BODY, OUTPUT, REPO, UsageError, parseFlags, splitList } from './args.mjs'
import { EDIT, comment, editIssue, setState } from './edit.mjs'
import { issueFields, output, pick } from './fields.mjs'
import { matches, parseSearch } from './search.mjs'

const parse = (argv, spec) => {
  const parsed = parseFlags(argv, { ...REPO, ...spec })
  setRepo(parsed.opts.repo)
  return parsed
}

const issueNumber = (ref) => {
  const n = refNumber(ref)
  if (!n) throw new UsageError(`invalid issue: "${ref ?? ''}"`)
  return n
}

const names = (list) => list.map((x) => x.name ?? x.login).join(', ')

function view(argv) {
  const { opts, pos } = parse(argv, { ...OUTPUT, comments: { short: 'c', bool: true } })
  const issue = api('GET', `/issues/${issueNumber(pos[0])}`)
  if (opts.json) return output(pick(issue, opts.json, issueFields), opts.jq)
  const lines = [
    `title:\t${issue.title}`,
    `state:\t${issue.state.toUpperCase()}`,
    `author:\t${issue.user.login}`,
    `labels:\t${names(issue.labels)}`,
    `comments:\t${issue.comments}`,
    `assignees:\t${names(issue.assignees)}`,
    `milestone:\t${issue.milestone?.title ?? ''}`,
    `number:\t${issue.number}`,
    '--',
    issue.body ?? '',
  ]
  if (opts.comments) {
    for (const c of issueFields.comments(issue)) {
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

function listIssues(argv) {
  const { opts } = parse(argv, {
    ...OUTPUT,
    label: { short: 'l', multi: true },
    state: { short: 's' },
    milestone: { short: 'm' },
    assignee: { short: 'a' },
    author: { short: 'A' },
    limit: { short: 'L' },
    search: { short: 'S' },
  })
  const q = parseSearch(opts.search)
  const params = new URLSearchParams({ state: q.state ?? opts.state ?? 'open', per_page: '100' })
  const labels = [...splitList(opts.label), ...q.labels]
  if (labels.length) params.set('labels', labels.join(','))
  if (opts.milestone) params.set('milestone', String(milestoneNumber(opts.milestone)))
  if (opts.assignee) params.set('assignee', assignees([opts.assignee])[0])
  if (opts.author) params.set('creator', assignees([opts.author])[0])
  const issues = apiAll(`/issues?${params}`)
    .filter((i) => !i.pull_request && matches(i, q))
    .slice(0, Number(opts.limit ?? 30))
  if (opts.json)
    return output(
      issues.map((i) => pick(i, opts.json, issueFields)),
      opts.jq,
    )
  for (const i of issues) {
    const row = [i.number, i.state.toUpperCase(), i.title, names(i.labels), i.updated_at]
    process.stdout.write(`${row.join('\t')}\n`)
  }
  return 0
}

function create(argv) {
  const { opts } = parse(argv, {
    ...BODY,
    title: { short: 't' },
    label: { short: 'l', multi: true },
    milestone: { short: 'm' },
    assignee: { short: 'a', multi: true },
  })
  if (!opts.title) throw new UsageError('must provide `--title` when not running interactively')
  const labels = splitList(opts.label)
  ensureLabels(labels)
  const body = { title: opts.title, body: readBody(opts) ?? '', labels }
  if (opts.milestone) body.milestone = milestoneNumber(opts.milestone)
  const people = assignees(splitList(opts.assignee))
  if (people.length) body.assignees = people
  process.stdout.write(`${api('POST', '/issues', body).html_url}\n`)
  return 0
}

function edit(argv) {
  const { opts, pos } = parse(argv, EDIT)
  if (pos.length === 0) throw new UsageError('issue number required')
  for (const ref of pos) editIssue(issueNumber(ref), opts)
  return 0
}

const STATE = { comment: { short: 'c' }, reason: { short: 'r' } }

export const issue = {
  view,
  list: listIssues,
  create,
  edit,
  close: (argv) => {
    const { opts, pos } = parse(argv, STATE)
    setState(issueNumber(pos[0]), 'closed', opts, 'issue')
    return 0
  },
  reopen: (argv) => {
    const { opts, pos } = parse(argv, STATE)
    setState(issueNumber(pos[0]), 'open', opts, 'issue')
    return 0
  },
  comment: (argv) => {
    const { opts, pos } = parse(argv, BODY)
    comment(issueNumber(pos[0]), opts)
    return 0
  },
}
