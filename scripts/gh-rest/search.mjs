import { UsageError } from './args.mjs'

// The search API is not repo-scoped, so the proxy refuses it: `--search` filters the listing here.
export function parseSearch(query) {
  const q = { words: [], scopes: [], state: undefined, labels: [] }
  for (const [, quoted, bare] of String(query ?? '').matchAll(/"([^"]*)"|(\S+)/g)) {
    const token = quoted ?? bare
    const qualifier = quoted === undefined && /^([a-z-]+):(\S+)$/i.exec(token)
    if (!qualifier) {
      q.words.push(token.toLowerCase())
      continue
    }
    const [, key, value] = qualifier
    if (key === 'in') q.scopes.push(value)
    else if (key === 'is' && (value === 'open' || value === 'closed')) q.state = value
    else if (key === 'is' && (value === 'issue' || value === 'pr')) continue
    else if (key === 'label') q.labels.push(value.replace(/^"|"$/g, ''))
    else throw new UsageError(`search qualifier "${token}" is not supported in the cloud session`)
  }
  return q
}

export function matches(item, q) {
  if (q.words.length === 0) return true
  const scopes = q.scopes.length ? q.scopes : ['title', 'body']
  const text = scopes
    .map((s) => (s === 'title' ? item.title : s === 'body' ? (item.body ?? '') : ''))
    .join('\n')
    .toLowerCase()
  return q.words.every((w) => text.includes(w))
}
