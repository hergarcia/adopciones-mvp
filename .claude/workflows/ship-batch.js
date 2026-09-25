export const meta = {
  name: 'ship-batch',
  description:
    'Ship feature stories one at a time: ready gate for the whole batch, then spec → build → review loop → PR → squash-merge per story',
  whenToUse:
    'Batch of stories labeled `lista`: args {stories: [12, 13], merge?: true, model?, effort?, stages?: {ready?, spec?, build?, review?, fix?, ship?, merge?: {model?, effort?}}}. ' +
    'Always auto mode (a subagent cannot ask); use /story-ship <#> --ask in a session for a story with product decisions. ' +
    'A story that fails stops the chain; rerun the batch from it. Default merge: true — every green PR is squash-merged into main before the next story starts.',
  phases: [
    { title: 'Ready' },
    { title: 'Spec' },
    { title: 'Build' },
    { title: 'Review' },
    { title: 'Ship' },
    { title: 'Merge' },
  ],
}

// Schemas: every stage returns typed data; the orchestrator decides, not the agent's prose.

const strings = { type: 'array', items: { type: 'string' } }

const PREP = {
  type: 'object',
  required: ['clean', 'sha'],
  properties: {
    clean: { type: 'boolean' },
    sha: { type: ['string', 'null'], description: 'HEAD of the freshly pulled main' },
    detail: { type: 'string' },
  },
}

const READY = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { enum: ['ready', 'abort'] },
    gaps: strings,
    alreadyDelivered: strings,
    assumptions: strings,
    detail: { type: 'string' },
  },
}

const SPEC = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { enum: ['ready', 'abort'] },
    branch: { type: ['string', 'null'] },
    featureDir: { type: ['string', 'null'] },
    userStories: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title'],
        properties: { id: { type: 'string' }, title: { type: 'string' }, priority: { type: 'string' } },
      },
    },
    assumptions: strings,
    outOfScope: strings,
    detail: { type: 'string' },
  },
}

const BUILD = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { enum: ['built', 'blocked'] },
    gates: { type: 'object' },
    userStoriesDone: strings,
    screenshotsDir: { type: ['string', 'null'] },
    assumptions: strings,
    detail: { type: 'string' },
  },
}

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'severity', 'category', 'summary', 'inScope', 'confidence'],
        properties: {
          id: { type: 'string' },
          severity: { enum: ['critical', 'high', 'medium', 'low'] },
          category: { type: 'string' },
          file: { type: ['string', 'null'] },
          line: { type: ['integer', 'null'] },
          summary: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
          inScope: { type: 'boolean' },
          confidence: { enum: ['confirmed', 'plausible'] },
        },
      },
    },
    summary: { type: 'string' },
  },
}

const FIX = {
  type: 'object',
  required: ['applied', 'rejected', 'gatesGreen'],
  properties: {
    applied: strings,
    rejected: {
      type: 'array',
      items: { type: 'object', required: ['id', 'reason'], properties: { id: { type: 'string' }, reason: { type: 'string' } } },
    },
    gatesGreen: { type: 'boolean' },
    detail: { type: 'string' },
  },
}

const SHIP = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { enum: ['green-pr', 'draft-pr', 'aborted'] },
    pr: { type: ['string', 'null'] },
    branch: { type: ['string', 'null'] },
    checks: { type: 'object' },
    assumptions: strings,
    followUps: { type: 'object' },
    detail: { type: 'string' },
  },
}

const MERGE = {
  type: 'object',
  required: ['merged'],
  properties: {
    merged: { type: 'boolean' },
    sha: { type: ['string', 'null'] },
    detail: { type: 'string' },
  },
}


const a = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const stories = (a.stories ?? []).map((n) => String(n).replace('#', ''))
if (!stories.length) {
  return {
    error:
      'Pass args as {stories: [12, 13], merge?, model?, effort?, stages?: {ready?, spec?, build?, review?, fix?, ship?, merge?: {model?, effort?}}}',
  }
}
if (a.mode === 'ask') log('El batch corre siempre en modo auto; para --ask usá /story-ship <#> --ask en la sesión')
const merge = a.merge !== false

const stageOpts = (name) => {
  const stage = a.stages?.[name] ?? {}
  const o = {}
  const model = stage.model ?? a.model
  const effort = stage.effort ?? a.effort
  if (model) o.model = model
  if (effort) o.effort = effort
  return o
}

const REPO = 'C:/Users/Hernan/Documents/GitHub/adopciones-mvp'
const STAGES = `${REPO}/.claude/skills/story-ship/stages`
const COMMON =
  `Work in the repo at ${REPO}. Decision mode: auto — never pause to ask; at a genuine fork make ` +
  `the most reasonable informed guess and record it in assumptions. Execute exactly the stage ` +
  `you are given, nothing before or after it. Your final message is parsed: return only the JSON ` +
  `the stage describes.`

const severityRank = { critical: 0, high: 1, medium: 2, low: 3 }
const isActionable = (f) => f.inScope && severityRank[f.severity] <= severityRank.medium

// Every story is graded before anything is touched: a batch with one unready story does not start.

phase('Ready')
const prep = await agent(
  `In the repo at ${REPO}: require "git status --short" empty (if not, report clean=false with ` +
    `the output and stop — never clean up), then "git checkout main && git pull --ff-only origin main" ` +
    `and report the HEAD sha. Return only the JSON.`,
  { phase: 'Ready', label: 'prep:main', effort: 'low', schema: PREP },
)
if (!prep || !prep.clean) {
  return { aborted: 'árbol sucio o main no actualizable', prep }
}

const readiness = await parallel(
  stories.map((n) => () =>
    agent(
      `Read ${STAGES}/ready.md and execute it for story #${n}. The checkout is already on main at ` +
        `${prep.sha}; never switch branches or pull. ${COMMON}`,
      { phase: 'Ready', label: `ready:#${n}`, schema: READY, ...stageOpts('ready') },
    ),
  ),
)
const notReady = stories
  .map((n, i) => ({ story: n, ...(readiness[i] ?? { status: 'abort', detail: 'ready agent died without reporting' }) }))
  .filter((r) => r.status !== 'ready')
if (notReady.length) {
  log(`${notReady.length} historia(s) no están listas — no se toca nada`)
  return { aborted: 'ready gate', notReady, readiness }
}

// One story at a time; the chain stops at the first that does not end merged.

const results = []
for (const [i, n] of stories.entries()) {
  const ready = readiness[i]
  const pos = `${i + 1}/${stories.length}`
  const result = { story: n, assumptions: [...(ready.assumptions ?? [])] }
  results.push(result)

  log(`Spec de #${n} (${pos})`)
  const spec = await agent(
    `Read ${STAGES}/spec.md and execute it for story #${n}. Ready output: ` +
      `${JSON.stringify({ alreadyDelivered: ready.alreadyDelivered ?? [], assumptions: ready.assumptions ?? [] })}. ${COMMON}`,
    { phase: 'Spec', label: `spec:#${n}`, schema: SPEC, ...stageOpts('spec') },
  )
  result.spec = spec ?? { status: 'abort', detail: 'spec agent died without reporting' }
  if (result.spec.status !== 'ready' || !result.spec.branch) {
    result.status = 'aborted'
    log(`#${n} abortó en Spec — corto la cadena`)
    break
  }
  result.assumptions.push(...(result.spec.assumptions ?? []))
  const { branch, featureDir } = result.spec

  log(`Build de #${n}: ${(result.spec.userStories ?? []).length} user stories`)
  const build = await agent(
    `Read ${STAGES}/build.md and execute it on branch "${branch}", feature dir "${featureDir}", ` +
      `user stories in this order: ${JSON.stringify(result.spec.userStories ?? [])}. ${COMMON}`,
    { phase: 'Build', label: `build:#${n}`, schema: BUILD, ...stageOpts('build') },
  )
  result.build = build ?? { status: 'blocked', detail: 'build agent died without reporting' }
  if (result.build.status !== 'built') {
    result.status = 'blocked'
    log(`#${n} quedó bloqueada en Build: ${result.build.detail ?? 'sin detalle'} — corto la cadena`)
    break
  }
  result.assumptions.push(...(result.build.assumptions ?? []))
  const screenshotsDir = result.build.screenshotsDir ?? null

  const review = { rounds: 0, applied: [], rejected: [], open: [], outOfScope: [] }
  const seenOutOfScope = new Set()
  for (const o of result.spec.outOfScope ?? []) {
    seenOutOfScope.add(o)
    review.outOfScope.push({ id: 'spec', summary: o, evidence: 'noted by the Spec stage' })
  }
  const reviewCtx =
    `Repo ${REPO}, branch "${branch}", feature dir "${featureDir}", screenshots dir ` +
    `${screenshotsDir ? `"${screenshotsDir}"` : 'none (driver not available yet)'}. Design guide: docs/10-design-system.md. Return only the findings JSON.`
  for (let round = 1; round <= 3; round++) {
    review.rounds = round
    log(`Review de #${n}, ronda ${round}`)
    const [code, design, taste] = await parallel([
      () => agent(reviewCtx, { phase: 'Review', label: `review:code:#${n}:r${round}`, schema: FINDINGS, agentType: 'code-reviewer', ...stageOpts('review') }),
      () => agent(reviewCtx, { phase: 'Review', label: `review:design:#${n}:r${round}`, schema: FINDINGS, agentType: 'design-reviewer', ...stageOpts('review') }),
      // Hernán's proxy judges what the screenshots show; without screens it has nothing to judge.
      () =>
        screenshotsDir
          ? agent(`Mode: screens. ${reviewCtx}`, { phase: 'Review', label: `review:taste:#${n}:r${round}`, schema: FINDINGS, agentType: 'hernan-proxy', ...stageOpts('review') })
          : null,
    ])
    const findings = [...(code?.findings ?? []), ...(design?.findings ?? []), ...(taste?.findings ?? [])]
    for (const f of findings.filter((f) => !f.inScope)) {
      const key = `${f.file ?? ''}:${f.summary}`
      if (!seenOutOfScope.has(key)) {
        seenOutOfScope.add(key)
        review.outOfScope.push({ id: f.id, severity: f.severity, summary: f.summary, evidence: f.evidence ?? '' })
      }
    }
    const actionable = findings.filter(isActionable).sort((x, y) => severityRank[x.severity] - severityRank[y.severity])
    review.open = actionable
    if (!actionable.length) {
      log(`#${n}: sin hallazgos accionables en la ronda ${round}`)
      break
    }
    log(`#${n}: ${actionable.length} hallazgos accionables — arreglando`)
    const fix = await agent(
      `Read ${STAGES}/review.md §Fix and apply it on branch "${branch}" (feature dir "${featureDir}") ` +
        `to exactly these findings, in this order: ${JSON.stringify(actionable)}. Verify each "plausible" ` +
        `one before touching code; reject with a reason when it is not real. Re-run the gates. ${COMMON}`,
      { phase: 'Review', label: `fix:#${n}:r${round}`, schema: FIX, ...stageOpts('fix') },
    )
    review.applied.push(...(fix?.applied ?? []))
    review.rejected.push(...(fix?.rejected ?? []))
    if (fix && !fix.gatesGreen) log(`#${n}: las compuertas quedaron rojas después del arreglo — la próxima ronda lo verá`)
  }
  const stillSevere = review.open.filter((f) => severityRank[f.severity] <= severityRank.high)
  review.status = stillSevere.length ? 'draft' : 'approved'
  result.review = review
  if (review.status === 'draft') log(`#${n}: quedan ${stillSevere.length} hallazgos graves después de 3 rondas — irá como borrador`)

  log(`Ship de #${n}`)
  const ship = await agent(
    `Read ${STAGES}/ship.md and execute it for story #${n} on branch "${branch}". Review output: ` +
      `${JSON.stringify({ status: review.status, open: review.open, applied: review.applied, rejected: review.rejected, outOfScope: review.outOfScope })}. ` +
      `Assumptions so far: ${JSON.stringify(result.assumptions)}. ${COMMON}`,
    { phase: 'Ship', label: `ship:#${n}`, schema: SHIP, ...stageOpts('ship') },
  )
  result.ship = ship ?? { status: 'aborted', pr: null, detail: 'ship agent died without reporting' }
  result.assumptions.push(...(result.ship.assumptions ?? []))
  result.status = result.ship.status
  if (result.ship.status !== 'green-pr' || !result.ship.pr) {
    log(`#${n} terminó "${result.ship.status}" — corto la cadena`)
    break
  }

  if (!merge) continue

  log(`Merge de #${n}`)
  const m = await agent(
    `Read ${STAGES}/merge.md and execute it for PR ${result.ship.pr} (story #${n}, branch "${branch}"). ${COMMON}`,
    { phase: 'Merge', label: `merge:#${n}`, effort: 'low', schema: MERGE },
  )
  result.merge = m ?? { merged: false, sha: null, detail: 'merge agent died without reporting' }
  if (!result.merge.merged) {
    result.status = 'unmerged'
    log(`#${n} quedó sin mergear (${result.merge.detail ?? 'sin detalle'}) — corto la cadena`)
    break
  }
  result.status = 'merged'
  log(`#${n} en main: ${result.merge.sha}`)
}


const done = results.filter((r) => r.status === 'merged' || (!merge && r.status === 'green-pr'))
return {
  mode: merge ? 'merge' : 'pr-only',
  results,
  skipped: stories.slice(results.length),
  main: done.length ? done[done.length - 1].merge?.sha ?? null : prep.sha,
  postBatch: [
    'Levantar el build local de main (/run-app) y recorrer lo que entró; al lado, los supuestos de cada historia (results[].assumptions).',
    'Leer docs/known-limitations.md: lo aceptado en este batch tiene que ser realmente de abajo del umbral.',
    'Revisar los seguimientos abiertos (results[].ship.followUps.opened) y lo listado «sobre el umbral, sin abrir»; marcar `lista` lo que entra al próximo batch.',
    'Lo que no gusta del build local es una historia nueva o un comentario en la que sigue, no un parche a mano.',
  ],
}
