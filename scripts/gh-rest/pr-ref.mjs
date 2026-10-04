import { api, currentBranch, refNumber, repoFullName, setRepo, sleep } from './api.mjs'
import { REPO, UsageError, parseFlags } from './args.mjs'

export const parse = (argv, spec) => {
  const parsed = parseFlags(argv, { ...REPO, ...spec })
  setRepo(parsed.opts.repo)
  return parsed
}

export function headPulls(branch, state) {
  const owner = repoFullName().split('/')[0]
  const params = new URLSearchParams({ head: `${owner}:${branch}`, state, per_page: '100' })
  return api('GET', `/pulls?${params}`)
}

// A number, a URL or a branch, like gh; without one, the current branch's pull request.
export function resolvePr(ref) {
  const n = refNumber(ref)
  if (n) return api('GET', `/pulls/${n}`)
  const branch = ref ?? currentBranch()
  const found = headPulls(branch, 'open')[0] ?? headPulls(branch, 'all')[0]
  if (!found) throw new UsageError(`no pull requests found for branch "${branch}"`)
  return api('GET', `/pulls/${found.number}`)
}

// GitHub computes mergeability in the background; gh's GraphQL read waits for it too.
export function withMergeable(pr) {
  let current = pr
  for (let i = 0; i < 5 && current.state === 'open' && current.mergeable === null; i++) {
    sleep(2000)
    current = api('GET', `/pulls/${pr.number}`)
  }
  return current
}
