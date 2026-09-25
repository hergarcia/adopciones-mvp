export const meta = {
  name: 'director',
  description:
    'One turn of the swarm (docs/09 §El enjambre): read the board, take the single most urgent step — a veto, the story in flight, an acceptance, a build, the next story, maintenance — and report',
  whenToUse:
    'In the swarm session (SWARM=1), from /loop: every run is one step. args: {dryRun?: true} reads the board and says which step it would take, without taking it.',
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
// decided here, and every judgment goes to an agent with a typed answer. It remembers nothing
// between turns: its state is the board on GitHub. Anything that fails ends in one `decision`
// issue that names the story (#N), and every step skips what such an issue names, so a failure
// waits for Hernán once instead of being retried every turn.

const REPO = 'C:/Users/Hernan/Documents/GitHub/adopciones-mvp'
const a = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const strings = { type: 'array', items: { type: 'string' } }
const nullable = (type) => ({ type: [type, 'null'] })
const storyItem = (extra = {}, required = []) => ({
  type: 'object',
  required: ['story', ...required],
  properties: { story: { type: 'integer' }, ...extra },
})

const BOARD = {
  type: 'object',
  required: ['clean', 'blocked', 'vetoes', 'streaks', 'inFlight', 'toAccept', 'ready', 'renovate', 'milestoneToReport'],
  properties: {
    clean: { type: 'boolean' },
    branch: nullable('string'),
    sha: nullable('string'),
    blocked: { type: 'array', items: { type: 'integer' } },
    vetoes: {
      type: 'array',
      items: storyItem(
        { milestone: { type: 'string' }, reason: nullable('string'), asked: { type: 'boolean' } },
        ['milestone', 'asked'],
      ),
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
      items: storyItem({ branch: { type: 'string' }, pr: nullable('string'), draft: { type: 'boolean' } }, ['branch', 'draft']),
    },
    toAccept: { type: 'array', items: storyItem({ sha: nullable('string') }) },
    ready: { type: 'array', items: storyItem({ milestone: { type: 'string' } }, ['milestone']) },
    renovate: {
      type: 'array',
      items: {
        type: 'object',
        required: ['pr', 'ci', 'asked'],
        properties: { pr: { type: 'integer' }, ci: { enum: ['green', 'red', 'pending'] }, asked: { type: 'boolean' } },
      },
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
    options: { type: ["array", "null"], items: { type: "string" } },
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

// One decision per subject. The first line of its body names what it blocks ("Historia: #N",
// "PR: #N"); an open one with the same title gets the new text as a comment instead of a twin.
// `once` asks only once ever, for what a closed answer settles (a Renovate PR, a limitation kept).
const openDecision = (title, about, body, phaseTitle, once = false) =>
  agent(
    `${HERE} Make sure Hernán has this as an issue labeled \`decision\` titled exactly "${title}". ` +
      `If such an issue is open, add the text below as a comment unless an identical comment is ` +
      `already there.${once ? ' If one exists but is closed, do nothing: it was already settled.' : ''} ` +
      `Otherwise create it (gh issue create --label decision --title "${title}" --body-file <file under ` +
      `.artifacts/director/>): the body's first line is exactly "${about}", then the text below, then ` +
      `a line that mentions @hergarcia. Return done=true with its URL.\n\n${body}`,
    { phase: phaseTitle, label: `decision:${title}`, effort: 'low', schema: DONE },
  )

const storyDecision = (story, body, phaseTitle) =>
  openDecision(`Decisión para #${story}`, `Historia: #${story}`, body, phaseTitle)

// A change to docs outside a story lands through its own PR; the swarm commits nothing to main.
const landDocs = (what, change, branch, phaseTitle) =>
  agent(
    `${HERE} Land this change in main through a PR of its own, on the branch docs/${branch}. If main ` +
      `already contains it, change nothing and return done=true. If that branch or an open PR from it ` +
      `exists, continue it instead of starting another. From an up-to-date main, apply exactly this ` +
      `change and nothing else:\n\n${change}\n\nCommit in English (Conventional Commits, docs scope), ` +
      `push, and open the PR in Spanish with a two-line body saying ${what}. Wait for CI (gh pr checks ` +
      `<n> --watch). Green: squash-merge with --delete-branch, then checkout main and pull. Red: leave ` +
      `the PR open. Return done=true only when it is in main, and the PR URL either way.`,
    { phase: phaseTitle, label: `docs:${branch}`, effort: 'low', schema: DONE },
  )

const shipOutcome = (run) => {
  if (!run) return { status: 'died', detail: 'ship-batch no devolvió nada', vetoed: false }
  const vetoed = /vetada|sin etiqueta lista/.test(JSON.stringify(run))
  if (run.aborted) return { status: 'aborted', detail: `${run.aborted}: ${JSON.stringify(run.notReady ?? run.prep ?? '')}`, vetoed }
  const r = run.results?.[0]
  if (!r) return { status: 'died', detail: 'ship-batch sin resultado', vetoed }
  const detail = [r.spec, r.build, r.ship, r.merge].map((x) => x?.detail).filter(Boolean).pop() ?? ''
  return { status: r.status, detail, pr: r.ship?.pr ?? null, vetoed: vetoed || r.status === 'vetoed' }
}

async function ship(story, action) {
  phase('Build')
  log(`${action === 'resume' ? 'Retomo' : 'Construyo'} #${story}`)
  const outcome = shipOutcome(await workflow('ship-batch', { stories: [story] }))
  if (outcome.status !== 'merged' && !outcome.vetoed) {
    await storyDecision(
      story,
      `El pipeline no llevó #${story} hasta main: terminó en «${outcome.status}».\n\n${outcome.detail}` +
        `${outcome.pr ? `\n\nPR: ${outcome.pr}` : ''}\n\n¿Se sigue, se achica la historia o se cierra?`,
      'Build',
    )
  }
  return { action, story, outcome }
}

// The order of docs/09 §Roles, as a pure function of the board, so a dry run can say it.
function decide(b) {
  const blocked = new Set(b.blocked)
  if (!b.clean) return { step: 'dirty', branch: b.branch }
  const streak = b.streaks.find((s) => s.vetoes >= 2)
  if (streak) return { step: 'streak', streak }
  // A veto whose reason was asked for and has not come waits; it does not hold the swarm.
  const veto = b.vetoes.find((v) => v.reason || !v.asked)
  if (veto) return { step: 'veto', veto }
  const flying = b.inFlight.find((f) => !blocked.has(f.story))
  if (flying) return { step: flying.draft ? 'draft' : 'resume', flying }
  const accept = b.toAccept.find((t) => !blocked.has(t.story))
  if (accept) return { step: 'accept', target: accept }
  if (b.milestoneToReport) return { step: 'report', milestone: b.milestoneToReport }
  const next = b.ready.find((r) => !blocked.has(r.story))
  if (next) return { step: 'build', next }
  return { step: 'write-or-maintain' }
}

phase('Board')
const board = await agent(
  `${HERE} Read the swarm's board and report it.${a.dryRun ? ' This is a dry run: change nothing at all; read main as origin/main after a git fetch.' : ' Change nothing except checking out and pulling main.'}
1. clean: "git status --short" is empty. If not, report clean=false, branch = the current branch, and stop.${a.dryRun ? '' : ' Else "git checkout main && git pull --ff-only origin main"; sha = HEAD.'}
2. blocked: for every open issue labeled "decision", the number N in the first line of its body when that line is "Historia: #N" or "PR: #N".
3. vetoes: open issues labeled "historia", without the label "vetada", whose label history (gh api repos/{owner}/{repo}/issues/<n>/events) has an "unlabeled" event for "lista" after its last "labeled" one. asked = an issue titled "Por qué vetaste #<n>" was created after that event. reason = Hernán's first comment written after that event, verbatim, on the story or on that issue (a closing comment counts); null if there is none.
4. streaks: per milestone with such removals, count the "lista" removals on its stories after the last closed issue titled "Freno por racha en <milestone>" (all of them if there is none); decisionOpen = such an issue is open.
5. inFlight: open issues with "lista" that have a local branch (git branch --list "feature/<n>-*") or an open PR from a branch feature/<n>-*; pr = the PR URL, draft = the PR is a draft.
6. toAccept: issues labeled "historia", outside milestone "M0 - Base", closed as completed by a merged PR, without the label "aceptada"; sha = the merge commit. Oldest first.
7. ready: open issues with "lista", not vetoed, not in inFlight; by milestone (M1 before M2 …), then number.
8. renovate: open PRs by app/renovate, their CI (gh pr checks: green, red or pending), and asked = an issue titled "Decisión para PR #<pr>" exists, open or closed.
9. milestoneToReport: the earliest milestone whose "historia" issues are all closed, where every one closed as completed carries "aceptada" (one closed as not planned counts as done), and for which no issue titled "Cierre de <milestone>" exists; else null.`,
  { phase: 'Board', label: 'board', effort: 'low', schema: BOARD },
)
if (!board) return { action: 'halt', why: 'el tablero no se pudo leer' }
const plan = decide(board)
if (a.dryRun) return { action: 'dry-run', plan, board }

if (plan.step === 'dirty') {
  await openDecision(
    'El árbol de trabajo quedó sucio',
    `Rama: ${plan.branch ?? 'desconocida'}`,
    `El enjambre encontró cambios sin commitear en «${plan.branch}» (una etapa cortada a mitad deja ` +
      `el árbol así) y no toca nada hasta que alguien decida qué hacer con ellos. Cerrá este issue ` +
      `cuando el árbol quede limpio.`,
    'Board',
  )
  return { action: 'waiting', why: `árbol sucio en ${plan.branch}` }
}

if (plan.step === 'streak') {
  const { milestone, vetoes, decisionOpen } = plan.streak
  if (!decisionOpen) {
    const stories = board.vetoes.filter((v) => v.milestone === milestone).map((v) => `#${v.story}`)
    await openDecision(
      `Freno por racha en ${milestone}`,
      `Milestone: ${milestone}`,
      `Vetaste ${vetoes} historias de ${milestone} (${stories.join(', ')}): el proxy está prediciendo ` +
        `mal tu criterio (docs/09 §Veto). El enjambre queda parado hasta que cierres este issue; el ` +
        `motivo de cada veto se te pregunta en su historia.`,
      'Veto',
    )
  }
  return { action: 'waiting', why: `freno por racha en ${milestone}` }
}

if (plan.step === 'veto') {
  phase('Veto')
  const { story, reason } = plan.veto
  if (!reason) {
    await openDecision(
      `Por qué vetaste #${story}`,
      `Historia: #${story}`,
      `Le sacaste \`lista\` a #${story}. ¿Qué no te cerró? Contestá acá: va a docs/11-criterio.md para ` +
        `que el proxy no lo repita, y Producto refina la historia contra eso.`,
      'Veto',
    )
    return { action: 'veto', story, outcome: 'reason asked' }
  }
  const landed = await landDocs(
    `que agrega a docs/11-criterio.md el veto de #${story}`,
    `Append one line under "## Vetos" in docs/11-criterio.md, in the doc's style: today's date ` +
      `(date +%F), #${story}, Hernán's reason verbatim in «», and which line above it confirms or ` +
      `adds to. Add nothing else; the doc only grows.\nHernán's reason: ${reason}`,
    `criterio-veto-${story}`,
    'Veto',
  )
  // The work built from the vetoed text is retired, so a relabeled story is specified again.
  const recorded = await agent(
    `${HERE} Record the veto of story #${story}: ` +
      `(1) gh issue edit ${story} --add-label vetada; ` +
      `(2) if an issue titled "Por qué vetaste #${story}" is open, close it with a comment that links ${landed?.url ?? 'docs/11-criterio.md'}; ` +
      `(3) if a local branch feature/${story}-* exists, rename it to vetada/${story}-<the rest of its name> (git branch -m), never deleting it; ` +
      `(4) if an open PR comes from a branch feature/${story}-*, close it with the comment "Vetada por Hernán; la historia se especifica de nuevo." ` +
      `Return done=true when all four hold.`,
    { phase: 'Veto', label: `vetada:#${story}`, effort: 'low', schema: DONE },
  )
  if (!landed?.done || !recorded?.done) {
    await storyDecision(
      story,
      `El veto de #${story} no quedó registrado del todo: ` +
        `${landed?.done ? '' : `la línea de docs/11 no entró (${landed?.url ?? 'sin PR'}); `}` +
        `${recorded?.done ? '' : 'la historia no quedó marcada como vetada.'}`,
      'Veto',
    )
  }
  return { action: 'veto', story, outcome: landed?.done && recorded?.done ? 'recorded' : 'recorded with problems' }
}

if (plan.step === 'draft') {
  const { story, pr } = plan.flying
  await storyDecision(
    story,
    `#${story} quedó en borrador: el pipeline no la dejó verde dentro de sus topes. El PR dice qué ` +
      `falla: ${pr}.\n\nPara que el enjambre la retome, marcá el PR como listo (gh pr ready) y cerrá ` +
      `este issue. Para dejarla, cerrá el PR.`,
    'Build',
  )
  return { action: 'draft', story }
}

if (plan.step === 'resume') return await ship(plan.flying.story, 'resume')

if (plan.step === 'accept') {
  phase('Accept')
  const { story, sha } = plan.target
  const qa = await agent(`Accept story #${story}, merged at ${sha ?? 'its merge commit on main'}.`, {
    phase: 'Accept',
    label: `qa:#${story}`,
    agentType: 'acceptance-qa',
    schema: QA,
  })
  if (!qa) {
    await storyDecision(story, `La aceptación de #${story} no terminó: el agente de QA no devolvió nada.`, 'Accept')
    return { action: 'accept', story, outcome: 'qa died' }
  }
  const failures = [...qa.failures].sort((x, y) => severityRank[x.severity] - severityRank[y.severity])
  const [followUp, ...aboveBar] = failures.filter((f) => f.passesBar)
  const belowBar = failures.filter((f) => !f.passesBar)
  const landed = belowBar.length
    ? await landDocs(
        `que acepta lo que la aceptación de #${story} encontró bajo el umbral`,
        `Add one entry per failure to docs/known-limitations.md, numbered after the last KL, in the ` +
          `doc's format (detection and reopening condition included), citing story #${story}: ` +
          JSON.stringify(belowBar),
        `kl-qa-${story}`,
        'Accept',
      )
    : { done: true }
  const closed = await agent(
    `${HERE} Close the acceptance of story #${story} (docs/09 §Umbral de seguimiento), skipping any part already done:
- Comment on the issue, in Spanish, the QA summary ${JSON.stringify(qa.summary)} and one line per criterion: ${JSON.stringify(qa.criteria.map((c) => `${c.id}: ${c.result}`))}.${aboveBar.length ? ` Under "Sobre el umbral, sin abrir", for Hernán: ${JSON.stringify(aboveBar)}.` : ''}
- ${followUp ? `Open ONE follow-up with scripts/new-story.sh --label historia,seguimiento, in the story's milestone, written as a story in product language from this failure, unless an issue labeled seguimiento already cites it: ${JSON.stringify(followUp)}. Never with lista.` : 'No failure passes the bar: open no follow-up.'}
- gh issue edit ${story} --add-label aceptada.
Return done=true when all of it holds, with the follow-up URL in url, or null.`,
    { phase: 'Accept', label: `close:#${story}`, effort: 'low', schema: DONE },
  )
  if (!landed?.done || !closed?.done) {
    await storyDecision(
      story,
      `La aceptación de #${story} corrió pero no cerró del todo: ` +
        `${landed?.done ? '' : `las limitaciones no entraron (${landed?.url ?? 'sin PR'}); `}` +
        `${closed?.done ? '' : 'el comentario, el seguimiento o la etiqueta aceptada no quedaron.'}`,
      'Accept',
    )
  }
  return { action: 'accept', story, qa: qa.summary, failures: failures.length }
}

if (plan.step === 'report') {
  phase('Accept')
  const m = plan.milestone
  const report = await agent(
    `${HERE} Milestone "${m}" is closed and accepted. Open one issue titled "Cierre de ${m}" with the ` +
      `label aviso and the milestone, in Spanish, for Hernán's walk of main (/run-app). Gather, with ` +
      `links: the stories and their PRs; each PR's "Supuestos tomados"; the aviso and decision issues ` +
      `of the milestone and whether they are open; incorporations to docs/03; the KL entries added in ` +
      `its PRs; its follow-ups; each story's QA comment. End with a line that mentions @hergarcia. ` +
      `Return done=true with its URL.`,
    { phase: 'Accept', label: `cierre:${m}`, schema: DONE },
  )
  if (!report?.done) {
    await openDecision(`Cierre de ${m} sin reporte`, `Milestone: ${m}`, `El reporte de cierre de ${m} no se pudo armar.`, 'Accept')
    return { action: 'waiting', why: `reporte de ${m} sin armar` }
  }
  return { action: 'milestone-report', milestone: m, url: report.url }
}

if (plan.step === 'build') return await ship(plan.next.story, 'build')

phase('Write')
const po = await agent('Mode: next.', { phase: 'Write', label: 'po:next', agentType: 'product-owner', schema: PO })
if (po?.knownLimitation) {
  const landed = await landDocs(
    `que agrega la limitación aceptada de #${po.story}`,
    `Add this entry to docs/known-limitations.md, numbered after the last KL, in the doc's format:\n` +
      `${po.knownLimitation}\nThen close issue #${po.story} as not planned with a comment citing the new KL.`,
    `kl-${po.story}`,
    'Write',
  )
  if (!landed?.done) {
    await storyDecision(po.story, `La limitación que acepta #${po.story} no entró (${landed?.url ?? 'sin PR'}).`, 'Write')
  }
  return { action: 'write', story: po.story, outcome: landed?.done ? 'known-limitation' : 'known-limitation, docs PR red' }
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
  let labeled = null
  if (verdict?.verdict === 'approve') {
    labeled = await agent(`Mode: label ${po.story}. Verdict: ${JSON.stringify(verdict)}`, {
      phase: 'Write',
      label: `po:label:#${po.story}`,
      agentType: 'product-owner',
      schema: PO,
    })
    if (labeled?.status === 'labeled') return { action: 'write', story: po.story, outcome: 'labeled' }
  }
  // Anything short of `lista` waits for Hernán once instead of cycling every turn.
  const reasons = (verdict?.reasons ?? []).map((r) => `- ${r.criterion}: ${r.evidence}`).join('\n')
  const body = !verdict
    ? `Tu proxy no respondió sobre #${po.story}.`
    : verdict.verdict === 'escalate'
      ? `${verdict.question ?? verdict.summary}\n\nOpciones (la recomendada primero):\n` +
        (verdict.options ?? []).map((o) => `- ${o}`).join('\n')
      : verdict.verdict === 'reject'
        ? `Tu proxy rechazó #${po.story} dos veces, aun después de refinarla:\n${reasons}\n\n¿Qué le falta, o se cierra?`
        : `Tu proxy aprobó #${po.story}, pero Producto no le pudo poner \`lista\`: ${labeled?.detail ?? 'no respondió'}.`
  await storyDecision(po.story, body, 'Write')
  return { action: 'write', story: po.story, outcome: verdict?.verdict ?? 'proxy died', detail: verdict?.summary }
}
if (po && po.status !== 'nothing-to-do') return { action: 'write', story: po.story, outcome: po.status, detail: po.detail }

phase('Maintain')
// Only what nobody asked Hernán about yet: once asked, a Renovate PR waits for his answer.
const renovateWork = board.renovate.filter((r) => r.ci !== 'pending' && !r.asked)
const mode = renovateWork.length ? 'renovate' : 'reopen'
const maint = await agent(`Mode: ${mode}.`, { phase: 'Maintain', label: `maint:${mode}`, agentType: 'maintainer', schema: MAINT })
const toHernan = [
  ...(maint?.needsHernan ?? []).map((x) => ({ pr: x.pr, text: `Renovate #${x.pr} cambia lo que juzga a los agentes: necesita tu \`reglas-aprobadas\`. ${x.why ?? ''}` })),
  ...(maint?.needsWork ?? []).map((x) => ({ pr: x.pr, text: `Renovate #${x.pr} no pasa CI y necesita código: ${x.what ?? ''}. ¿Se construye como trabajo propio o se espera?` })),
  ...(maint?.waiting ?? [])
    .filter((x) => !/CI running/i.test(x.why ?? ''))
    .map((x) => ({ pr: x.pr, text: `Renovate #${x.pr} está verde pero no se mergea solo: ${x.why ?? ''}.` })),
]
for (const { pr, text } of toHernan.filter((x) => x.pr)) {
  await openDecision(`Decisión para PR #${pr}`, `PR: #${pr}`, text, 'Maintain', true)
}
for (const hit of maint?.reopen ?? []) {
  await openDecision(
    `${hit.kl} cumple su condición de reapertura`,
    `Limitación: ${hit.kl}`,
    `${hit.condition ?? ''}\n\n${hit.evidence ?? ''}\n\n¿Se construye ahora o sigue aceptada?`,
    'Maintain',
    true,
  )
}
return { action: mode === 'renovate' ? 'maintain' : 'idle', maintenance: maint }
