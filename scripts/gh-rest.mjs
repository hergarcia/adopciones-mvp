#!/usr/bin/env node
// `gh` for Claude Code cloud sessions, installed by scripts/cloud-up.sh. Their proxy authenticates
// GitHub's REST API and refuses GraphQL, which `gh issue`, `gh pr`, `gh label list` and
// `gh repo view` use: those go over REST here, with the same flags and the same `--json` shapes.
// Anything else goes to the real gh (GH_REAL) untouched.
import { passthrough } from './gh-rest/api.mjs'
import { UsageError } from './gh-rest/args.mjs'
import { issue } from './gh-rest/issue.mjs'
import { misc } from './gh-rest/misc.mjs'
import { pr } from './gh-rest/pr.mjs'

const routes = { issue, pr, ...misc }

function main(argv) {
  const [command, sub, ...rest] = argv
  if (command === 'search') {
    process.stderr.write(
      'gh search is not available in the cloud session (the proxy only serves this repository); ' +
        'use gh issue list --search or gh pr list --search\n',
    )
    return 1
  }
  const handler = routes[command]?.[sub]
  if (!handler || rest.includes('--help') || rest.includes('-h')) return passthrough(argv)
  return handler(rest)
}

try {
  process.exitCode = main(process.argv.slice(2))
} catch (error) {
  process.stderr.write(`${error instanceof UsageError ? '' : 'gh-rest: '}${error.message}\n`)
  process.exitCode = 1
}
