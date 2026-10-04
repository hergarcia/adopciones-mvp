import { api, apiAll } from './api.mjs'

const up = (v) => (v ? String(v).toUpperCase() : '')

export function rollup(sha) {
  const runs = apiAll(`/commits/${sha}/check-runs?per_page=100`, 'check_runs').map((r) => ({
    __typename: 'CheckRun',
    name: r.name,
    status: up(r.status),
    conclusion: up(r.conclusion),
    startedAt: r.started_at,
    completedAt: r.completed_at,
    detailsUrl: r.details_url,
    workflowName: '',
  }))
  const statuses = api('GET', `/commits/${sha}/status`).statuses.map((s) => ({
    __typename: 'StatusContext',
    context: s.context,
    state: up(s.state),
    targetUrl: s.target_url,
    description: s.description ?? '',
    startedAt: s.created_at,
  }))
  return [...runs, ...statuses]
}

// gh's buckets: pass, fail, pending, skipping, cancel.
export function bucket(c) {
  if (c.context !== undefined) {
    if (c.state === 'SUCCESS') return 'pass'
    return c.state === 'PENDING' || c.state === 'EXPECTED' ? 'pending' : 'fail'
  }
  if (c.status !== 'COMPLETED') return 'pending'
  if (c.conclusion === 'SUCCESS') return 'pass'
  if (c.conclusion === 'NEUTRAL' || c.conclusion === 'SKIPPED') return 'skipping'
  return c.conclusion === 'CANCELLED' ? 'cancel' : 'fail'
}

const elapsed = (from, to) => {
  if (!from || !to) return '0'
  const s = Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000))
  return s >= 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`
}

export const checkRow = (c) => ({
  name: c.name ?? c.context,
  state: c.context !== undefined ? c.state : c.conclusion || c.status,
  bucket: bucket(c),
  link: c.detailsUrl ?? c.targetUrl ?? '',
  description: c.description ?? '',
  workflow: c.workflowName ?? '',
  startedAt: c.startedAt,
  completedAt: c.completedAt ?? null,
  elapsed: elapsed(c.startedAt, c.completedAt),
})
