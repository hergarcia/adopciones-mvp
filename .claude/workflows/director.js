export const meta = {
  name: 'director',
  description:
    'One turn of the swarm (docs/09 §El enjambre): read the board, take the single most urgent step — a veto, the story in flight, an acceptance, a build, the next story, maintenance — and report',
  whenToUse:
    'In the swarm session (SWARM=1), from /loop: every run is one step. args: {dryRun?: true} reads the board and says what it would do without doing it.',
  phases: [
    { title: 'Board' },
    { title: 'Veto' },
    { title: 'Accept' },
    { title: 'Build' },
    { title: 'Write' },
    { title: 'Maintain' },
  ],
}

// The Director is code on purpose (docs/09 §Roles): the order of the steps and when to stop are
// decided here, and every judgment goes to an agent with a typed answer.

const REPO = 'C:/Users/Hernan/Documents/GitHub/adopciones-mvp'
const a = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const strings = { type: 'array', items: { type: 'string' } }
const nullable = (type) => ({ type: [type, 'null'] })

const BOARD = {
  type: 'object',
  required: ['clean', 'vetoes', 'streaks', 'inFlight', 'toAccept', 'ready', 'renovate', 'milestoneToReport'],
  properties: {
    clean: { type: 'boolean' },
    sha: nullable('string'),
    vetoes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['story', 'milestone', 'recorded'],
        properties: {
          story: { type: 'integer' },
          milestone: { type: 'string' },
          reason: nullable('string'),
          recorded: { type: 'boolean' },
        },
      },
    },
    streaks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['milestone', 'vetoes', 'decisionOpen'],
        properties: { milestone: { type: 'string' }, vetoes: { type: 'integer' }, decisionOpen: { type: 'boolean' } },
      },
    },
    inFlight: {
      type: 'array',
      items: {
        type: 'object',
        required: ['story', 'branch', 'draft'],
        properties: { story: { type: 'integer' }, branch: { type: 'string' }, pr: nullable('string'), draft: { type: 'boolean' } },
      },
    },
    toAccept: {
      type: 'array',
      items: { type: 'object', required: ['story'], properties: { story: { type: 'integer' }, sha: nullable('string') } },
    },
    ready: {
      type: 'array',
      items: { type: 'object', required: ['story', 'milestone'], properties: { story: { type: 'integer' }, milestone: { type: 'string' } } },
    },
    renovate: {
      type: 'array',
      items: { type: 'object', required: ['pr', 'ci'], properties: { pr: { type: 'integer' }, ci: { enum: ['green', 'red', 'pending'] } } },
    },
    milestoneToReport: nullable('string'),
    detail: { type: 'string' },
  },
}

const DONE = {
  type: 'object',
  required: ['done'],
  properties: { done: { type: 'boolean' }, url: nullable('string'), detail: { type: 'string' } },
}

const PROXY = {
  type: 'object',
  required: ['verdict', 'reasons'],
  properties: {
    story: nullable('integer'),
    updatedAt: nullable('string'),
    verdict: { enum: ['approve', 'reject', 'escalate'] },
    reasons: {
      type: 'array',
      items: {
        type: 'object',
        required: ['criterion', 'evidence'],
        properties: { criterion: { type: 'string' }, evidence: { type: 'string' }, confidence: { type: 'string' } },
      },
    },
    reserved: nullable('string'),
    question: nullable('string'),
    options: strings,
    summary: { type: 'string' },
  },
}

const PO = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { enum: ['prepared', 'refined', 'labeled', 'vetoed', 'blocked', 'not-labeled', 'nothing-to-do'] },
    story: nullable('integer'),
    milestone: nullable('string'),
    created: { type: 'boolean' },
    grade: nullable('string'),
    decisions: strings,
    incorporation: nullable('string'),
    aviso: nullable('string'),
    decision: nullable('string'),
    knownLimitation: nullable('string'),
    detail: { type: 'string' },
  },
}

const QA = {
  type: 'object',
  required: ['story', 'criteria', 'failures'],
  properties: {
    story: { type: 'integer' },
    sha: nullable('string'),
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'result'],
        properties: { id: { type: 'string' }, text: { type: 'string' }, result: { type: 'string' }, evidence: { type: 'string' } },
      },
    },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        required: ['criterion', 'severity', 'summary', 'passesBar'],
        properties: {
          criterion: { type: 'string' },
          severity: { enum: ['critical', 'high', 'medium', 'low'] },
          summary: { type: 'string' },
          passesBar: { type: 'boolean' },
          why: { type: 'string' },
        },
      },
    },
    summary: { type: 'string' },
  },
}

const MAINT = {
  type: 'object',
  properties: {
    merged: { type: 'array', items: { type: 'object' } },
    needsHernan: { type: 'array', items: { type: 'object' } },
    needsWork: { type: 'array', items: { type: 'object' } },
    waiting: { type: 'array', items: { type: 'object' } },
    reopen: { type: 'array', items: { type: 'object' } },
    detail: { type: 'string' },
  },
}

const HERE = `Work in the repo at ${REPO}, on main. Your final message is parsed: return only the JSON asked for.`
const severityRank = { critical: 0, high: 1, medium: 2, low: 3 }

// Lands a change to docs through its own PR: the swarm commits nothing to main directly.
const landDocs = (what, change, label, phaseTitle) =>
  agent(
    `${HERE} Land this change in main through a PR of its own. From an up-to-date main, create the ` +
      `branch docs/${label}, apply exactly this change and nothing else:\n\n${change}\n\n` +
      `Commit in English (Conventional Commits, docs scope), push, and open the PR in Spanish with a ` +
      `two-line body saying ${what}. Wait for CI (gh pr checks <n> --watch). Green: squash-merge with ` +
      `--delete-branch, then checkout main and pull. Red: leave the PR open. Report done=true only ` +
      `when it is merged, with the PR URL.`,
    { phase: phaseTitle, label: `docs:${label}`, effort: 'low', schema: DONE },
  )

const openDecision = (title, body, label) =>
  agent(
    `${HERE} Make sure Hernán has this question as an open issue. If an open issue with the label ` +
      `\`decision\` and this exact title already exists, do nothing and return its URL. Otherwise ` +
      `create it: gh issue create --label decision --title "${title}" --body-file <file>, with this ` +
      `body in Spanish, ending with a line that mentions @hergarcia:\n\n${body}`,
    { label: `decision:${label}`, effort: 'low', schema: DONE },
  )


phase('Board')
const board = await agent(
  `${HERE} Read the swarm's board and report it; change nothing except checking out and pulling main.
1. "git status --short" must be empty (else clean=false and stop). Then "git checkout main && git pull --ff-only origin main"; sha = HEAD.
2. vetoes: open issues labeled historia whose label history (gh api repos/{owner}/{repo}/issues/<n>/events) has an "unlabeled" event for "lista" after the last "labeled" one. reason = Hernán's first comment after that event, verbatim, or null. recorded = the issue carries the label "vetada".
3. streaks: per milestone with vetoes, count the "lista" removals on its stories after the last closed issue titled "Freno por racha en <milestone>" (all of them if there is none); decisionOpen = such an issue is open.
4. inFlight: open issues with "lista" that have a remote branch feature/<n>-* or an open PR from one; pr = its URL, draft = the PR is a draft.
5. toAccept: closed issues labeled historia, outside milestone "M0 - Base", closed by a merged PR, without the label "aceptada"; sha = the merge commit. Oldest first.
6. ready: open issues with "lista", not vetoed, not in inFlight; ordered by milestone (M1 before M2 …) then number.
7. renovate: open PRs by app/renovate and their CI (gh pr checks): green, red or pending.
8. milestoneToReport: the earliest milestone whose issues labeled historia are all closed and carry "aceptada", and for which no issue titled "Cierre de <milestone>" exists; else null.`,
  { phase: 'Board', label: 'board', effort: 'low', schema: BOARD },
)
if (!board || !board.clean) return { action: 'halt', why: 'árbol sucio o main no actualizable', board }
if (a.dryRun) return { action: 'dry-run', board }


const streak = board.streaks.find((s) => s.vetoes >= 2)
if (streak) {
  phase('Veto')
  if (!streak.decisionOpen) {
    const vetoed = board.vetoes.filter((v) => v.milestone === streak.milestone).map((v) => `#${v.story}`)
    await openDecision(
      `Freno por racha en ${streak.milestone}`,
      `Vetaste ${streak.vetoes} historias de ${streak.milestone} (${vetoed.join(', ')}): el proxy está ` +
        `prediciendo mal tu criterio (docs/09 §Veto). El enjambre queda parado hasta que cierres este ` +
        `issue. Si querés, antes dejá en un comentario qué vio mal, y va a docs/11-criterio.md.`,
      'racha',
    )
  }
  return { action: 'halted', why: `freno por racha en ${streak.milestone}`, board }
}

const veto = board.vetoes.find((v) => !v.recorded)
if (veto) {
  phase('Veto')
  if (veto.reason) {
    await landDocs(
      `que agrega a docs/11-criterio.md el veto de #${veto.story}`,
      `Append one line under "## Vetos" in docs/11-criterio.md, in the doc's style: today's date ` +
        `(date +%F), #${veto.story}, Hernán's reason verbatim in «», and which line above it confirms ` +
        `or adds to. Add nothing else; the doc only grows.\nHernán's reason: ${veto.reason}`,
      `criterio-veto-${veto.story}`,
      'Veto',
    )
  } else {
    await openDecision(
      `Por qué vetaste #${veto.story}`,
      `Le sacaste \`lista\` a #${veto.story}. ¿Qué no te cerró? Tu respuesta va a docs/11-criterio.md ` +
        `para que el proxy no lo repita, y Producto refina la historia contra eso.`,
      `veto-${veto.story}`,
    )
  }
  await agent(`${HERE} gh issue edit ${veto.story} --add-label vetada. Return done=true.`, {
    phase: 'Veto',
    label: `vetada:#${veto.story}`,
    effort: 'low',
    schema: DONE,
  })
  return { action: 'veto', story: veto.story, reason: veto.reason }
}


const flying = board.inFlight.find((f) => !f.draft)
if (flying) {
  phase('Build')
  log(`Retomo #${flying.story} (${flying.branch})`)
  const run = await workflow('ship-batch', { stories: [flying.story] })
  return { action: 'resume', story: flying.story, run }
}
for (const parked of board.inFlight.filter((f) => f.draft)) {
  await openDecision(
    `#${parked.story} quedó en borrador`,
    `El pipeline no dejó verde a #${parked.story} dentro de sus topes: ${parked.pr}. El PR dice qué ` +
      `falla. ¿Se sigue, se achica la historia o se cierra?`,
    `draft-${parked.story}`,
  )
}


const toAccept = board.toAccept[0]
if (toAccept) {
  phase('Accept')
  const qa = await agent(
    `Accept story #${toAccept.story}, merged at ${toAccept.sha ?? 'its merge commit on main'}.`,
    { phase: 'Accept', label: `qa:#${toAccept.story}`, agentType: 'acceptance-qa', schema: QA },
  )
  if (!qa) return { action: 'accept', story: toAccept.story, outcome: 'qa agent died without reporting' }
  const failures = [...qa.failures].sort((x, y) => severityRank[x.severity] - severityRank[y.severity])
  const [followUp, ...aboveBar] = failures.filter((f) => f.passesBar)
  const belowBar = failures.filter((f) => !f.passesBar)
  await agent(
    `${HERE} Route the acceptance of story #${toAccept.story} (docs/09 §Umbral de seguimiento):
- Comment the QA summary on the issue, in Spanish: ${JSON.stringify(qa.summary)} and one line per criterion from ${JSON.stringify(qa.criteria.map((c) => `${c.id}: ${c.result}`))}.
- ${followUp ? `Open ONE follow-up with scripts/new-story.sh --label historia,seguimiento, in the story's milestone, written as a story in product language from this failure: ${JSON.stringify(followUp)}. Never with lista.` : 'No failure passes the bar: open no follow-up.'}
- ${aboveBar.length ? `List these in that same comment under "Sobre el umbral, sin abrir", for Hernán: ${JSON.stringify(aboveBar)}.` : 'Nothing else passes the bar.'}
- gh issue edit ${toAccept.story} --add-label aceptada.
Return done=true with the follow-up URL in url, or null.`,
    { phase: 'Accept', label: `route:#${toAccept.story}`, effort: 'low', schema: DONE },
  )
  if (belowBar.length) {
    await landDocs(
      `que acepta lo que la aceptación de #${toAccept.story} encontró bajo el umbral`,
      `Add one entry per failure to docs/known-limitations.md, numbered after the last KL, in the ` +
        `doc's format (detection and reopening condition included), citing story #${toAccept.story}: ` +
        JSON.stringify(belowBar),
      `kl-qa-${toAccept.story}`,
      'Accept',
    )
  }
  return { action: 'accept', story: toAccept.story, qa: qa.summary, failures: failures.length }
}

if (board.milestoneToReport) {
  phase('Accept')
  const m = board.milestoneToReport
  await agent(
    `${HERE} Milestone "${m}" is closed and accepted. Open one issue titled "Cierre de ${m}" with the ` +
      `label aviso and the milestone, in Spanish, for Hernán's walk of main (/run-app). Gather, with ` +
      `links: the stories and their PRs; each PR's "Supuestos tomados"; the aviso and decision issues ` +
      `of the milestone and whether they are open; incorporations to docs/03; the KL entries added in ` +
      `its PRs; its follow-ups; each story's QA comment. End with a line that mentions @hergarcia.`,
    { phase: 'Accept', label: `cierre:${m}`, schema: DONE },
  )
  return { action: 'milestone-report', milestone: m }
}


const next = board.ready[0]
if (next) {
  phase('Build')
  log(`Construyo #${next.story} (${next.milestone})`)
  const run = await workflow('ship-batch', { stories: [next.story] })
  return { action: 'build', story: next.story, run }
}


phase('Write')
const po = await agent('Mode: next.', { phase: 'Write', label: 'po:next', agentType: 'product-owner', schema: PO })
if (po?.knownLimitation) {
  await landDocs(
    `que agrega la limitación aceptada de #${po.story}`,
    `Add this entry to docs/known-limitations.md, numbered after the last KL, in the doc's format:\n${po.knownLimitation}\n` +
      `Then close issue #${po.story} as not planned with a comment citing the new KL.`,
    `kl-${po.story}`,
    'Write',
  )
}
if (po && (po.status === 'prepared' || po.status === 'refined') && po.story) {
  let verdict = null
  for (let round = 1; round <= 2; round++) {
    verdict = await agent(`story ${po.story}`, {
      phase: 'Write',
      label: `proxy:#${po.story}:r${round}`,
      agentType: 'hernan-proxy',
      schema: PROXY,
    })
    if (!verdict || verdict.verdict !== 'reject' || round === 2) break
    await agent(`Mode: refine ${po.story}. Findings: ${JSON.stringify(verdict.reasons)}`, {
      phase: 'Write',
      label: `po:refine:#${po.story}`,
      agentType: 'product-owner',
      schema: PO,
    })
  }
  if (verdict?.verdict === 'approve') {
    const labeled = await agent(`Mode: label ${po.story}. Verdict: ${JSON.stringify(verdict)}`, {
      phase: 'Write',
      label: `po:label:#${po.story}`,
      agentType: 'product-owner',
      schema: PO,
    })
    return { action: 'write', story: po.story, outcome: labeled?.status ?? 'label agent died', detail: labeled?.detail }
  }
  if (verdict?.verdict === 'escalate') {
    await openDecision(
      `#${po.story}: ${verdict.question ?? 'una decisión tuya'}`,
      `${verdict.summary}\n\nOpciones (la recomendada primero):\n${(verdict.options ?? []).map((o) => `- ${o}`).join('\n')}`,
      `proxy-${po.story}`,
    )
  }
  return { action: 'write', story: po.story, outcome: verdict?.verdict ?? 'proxy died', detail: verdict?.summary }
}
if (po && po.status !== 'nothing-to-do') return { action: 'write', story: po.story, outcome: po.status, detail: po.detail }


phase('Maintain')
const mode = board.renovate.length ? 'renovate' : 'reopen'
const maint = await agent(`Mode: ${mode}.`, { phase: 'Maintain', label: `maint:${mode}`, agentType: 'maintainer', schema: MAINT })
return {
  action: mode === 'renovate' ? 'maintain' : 'idle',
  maintenance: maint,
  note:
    mode === 'reopen'
      ? 'No quedaba trabajo propio: lo que resta espera a Hernán (decision, borradores, vetos sin respuesta).'
      : undefined,
}
