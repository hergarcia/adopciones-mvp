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
// between turns: its state is the board on GitHub. It waits for Hernán only on what he started (a
// veto, a streak, a rules approval) and on what is reserved to him (money, name, indexing), which
// blocks only its own story. Everything else it decides: a step that fails leaves a marked comment
// on the story and is retried; past its limit the story is parked with `trabada` or `en-pausa` and
// an `aviso`, and every step skips a parked story, so a failure costs a few turns, not the swarm.

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

const STASH = {
  type: 'object',
  required: ['stashed'],
  properties: { stashed: { type: 'boolean' }, name: nullable('string'), files: strings, detail: { type: 'string' } },
}

const COUNT = {
  type: 'object',
  required: ['count'],
  properties: { count: { type: 'integer' } },
}

const PROXY = {
  type: 'object',
  required: ['verdict', 'reasons'],
  properties: {
    story: nullable('integer'),
    updatedAt: nullable('string'),
    verdict: { enum: ['approve', 'reject', 'decide'] },
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
    options: { type: ['array', 'null'], items: { type: 'string' } },
    summary: { type: 'string' },
  },
}

const PO = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { enum: ['prepared', 'refined', 'decided', 'labeled', 'vetoed', 'blocked', 'not-labeled', 'nothing-to-do'] },
    story: nullable('integer'),
    milestone: nullable('string'),
    created: { type: 'boolean' },
    grade: nullable('string'),
    decisions: strings,
    docChange: nullable('string'),
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
    closed: { type: 'array', items: { type: 'object' } },
    needsHernan: { type: 'array', items: { type: 'object' } },
    waiting: { type: 'array', items: { type: 'object' } },
    reopen: { type: 'array', items: { type: 'object' } },
    detail: { type: 'string' },
  },
}

const HERE = `Work in the repo at ${REPO}, on main. Your final message is parsed: return only the JSON asked for.`
const severityRank = { critical: 0, high: 1, medium: 2, low: 3 }
// Steps that run gh and git from exact instructions go to Sonnet; every judgment stays on the
// session model (docs/09, decisión 2026-09-30).
const CHORE = { model: 'sonnet', effort: 'low' }

// Attempts a story gets at each step before it is parked: a draft is retaken twice more, anything
// else is retried once (docs/09 §Dónde corre).
const LIMIT = { draft: 3, build: 2, accept: 2, veto: 2, write: 2 }

// What Hernán started or what is reserved to him: one decision per subject. The first line of its
// body names what it blocks ("Historia: #N", "PR: #N"); an open one with the same title gets the
// new text as a comment instead of a twin. `once` asks only once ever and never adds to it.
const openDecision = (title, about, body, phaseTitle, once = false) =>
  agent(
    `${HERE} Make sure Hernán has this as an issue labeled \`decision\` titled exactly "${title}". ` +
      (once
        ? `If such an issue exists, open or closed, change nothing. `
        : `If such an issue is open, add the text below as a comment unless an identical comment is already there. `) +
      `Otherwise create it (gh issue create --label decision --title "${title}" --body-file <file under ` +
      `.artifacts/director/>): the body's first line is exactly "${about}", then the text below, then ` +
      `a line that mentions @hergarcia. Return done=true with its URL.\n\n${body}`,
    { phase: phaseTitle, label: `decision:${title}`, ...CHORE, schema: DONE },
  )

// What the swarm decided or did on its own, for Hernán to read when he comes back. It blocks nothing.
const openAviso = (title, body, phaseTitle) =>
  agent(
    `${HERE} Make sure there is an issue labeled \`aviso\` titled exactly "${title}". If one is open, ` +
      `add the text below as a comment unless an identical comment is already there. Otherwise create ` +
      `it (gh issue create --label aviso --title "${title}" --body-file <file under .artifacts/director/>), ` +
      `with the milestone of the story the title names, if it names one. Return done=true with its URL.\n\n${body}`,
    { phase: phaseTitle, label: `aviso:${title}`, ...CHORE, schema: DONE },
  )

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
    { phase: phaseTitle, label: `docs:${branch}`, ...CHORE, schema: DONE },
  )

// The count lives on the issue, so it survives between turns; a new `lista` starts it again.
const countFailure = (story, step, limit, what, phaseTitle) =>
  agent(
    `${HERE} On issue #${story}, count the comments whose first line is exactly ` +
      `"<!-- enjambre:fallo:${step} -->" and that were created after the issue's last "labeled" event ` +
      `for "lista" (gh api repos/{owner}/{repo}/issues/${story}/events; all of them if it never had ` +
      `\`lista\`). Then add one more comment through --body-file (a file under .artifacts/director/): ` +
      `first line exactly "<!-- enjambre:fallo:${step} -->", then, in Spanish, "Intento <that count + 1> ` +
      `de ${limit}:" and the text below. Return count = that count + 1.\n\n${what}`,
    { phase: phaseTitle, label: `fallo:${step}:#${story}`, ...CHORE, schema: COUNT },
  )

// `trabada` goes on before `lista` comes off, so the label history reads as parking, not a veto.
async function park(story, label, why, retry, phaseTitle) {
  await agent(
    `${HERE} Park story #${story}: gh issue edit ${story} --add-label ${label}; then, only if it still ` +
      `carries lista, gh issue edit ${story} --add-label ${label} --remove-label lista. Leave its branches ` +
      `and PRs as they are: a draft stays a draft. Return done=true when it carries ${label} and not lista.`,
    { phase: phaseTitle, label: `${label}:#${story}`, ...CHORE, schema: DONE },
  )
  await openAviso(
    `${label === 'trabada' ? 'Trabada' : 'En pausa'}: #${story}`,
    `${why}\n\nEl enjambre la saltea y sigue con lo demás. ${retry}`,
    phaseTitle,
  )
}

async function failed(story, step, limit, what, retry, phaseTitle) {
  const tally = await countFailure(story, step, limit, what, phaseTitle)
  const parked = (tally?.count ?? 0) >= limit
  if (parked) await park(story, 'trabada', `#${story} falló ${limit} veces en el mismo paso. La última: ${what}`, retry, phaseTitle)
  return parked
}

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
  log(`${action === 'build' ? 'Construyo' : 'Retomo'} #${story}`)
  const outcome = shipOutcome(await workflow('ship-batch', { stories: [story] }))
  if (outcome.status === 'merged' || outcome.vetoed) return { action, story, outcome }
  const draft = outcome.status === 'draft-pr'
  const parked = await failed(
    story,
    'build',
    draft ? LIMIT.draft : LIMIT.build,
    draft
      ? `quedó en borrador; el PR dice qué falla: ${outcome.pr}`
      : `el pipeline terminó en «${outcome.status}»: ${outcome.detail}${outcome.pr ? ` (PR ${outcome.pr})` : ''}`,
    'Para reintentarla, sacale `trabada` y ponele `lista`; para achicarla, comentá la historia.',
    'Build',
  )
  return { action, story, outcome, parked }
}

// The order of docs/09 §Roles, as a pure function of the board, so a dry run can say it.
function decide(b) {
  const blocked = new Set(b.blocked)
  if (!b.clean) return { step: 'dirty', branch: b.branch }
  const streak = b.streaks.find((s) => s.vetoes >= 2)
  if (streak) return { step: 'streak', streak }
  // A veto whose reason was asked for and has not come waits; it does not hold the swarm.
  const veto = b.vetoes.find((v) => !blocked.has(v.story) && (v.reason || !v.asked))
  if (veto) return { step: 'veto', veto }
  const flying = b.inFlight.find((f) => !blocked.has(f.story))
  if (flying) return { step: 'resume', flying }
  const accept = b.toAccept.find((t) => !blocked.has(t.story))
  if (accept) return { step: 'accept', target: accept }
  if (b.milestoneToReport) return { step: 'report', milestone: b.milestoneToReport }
  const next = b.ready.find((r) => !blocked.has(r.story))
  if (next) return { step: 'build', next }
  return { step: 'write-or-maintain' }
}

// A removal of `lista` is a veto unless the swarm parked the story (`park` adds `trabada` first).
const VETO =
  `a veto is an "unlabeled" event for "lista" in the issue's label history (gh api ` +
  `repos/{owner}/{repo}/issues/<n>/events) made while the issue did not carry "trabada": a removal ` +
  `with a "labeled" event for "trabada" at or before it, and no "unlabeled" one for "trabada" in ` +
  `between, is the swarm parking a stuck story, not a veto`

const readBoard = () =>
  agent(
    `${HERE} Read the swarm's board and report it.${a.dryRun ? ' This is a dry run: change nothing at all; read main as origin/main after a git fetch.' : ' Change nothing except checking out and pulling main.'} In what follows, ${VETO}.
1. clean: "git status --short" is empty. If not, report clean=false, branch = the current branch, and stop.${a.dryRun ? '' : ' Else "git checkout main && git pull --ff-only origin main"; sha = HEAD.'}
2. blocked: for every open issue labeled "decision", the number N in the first line of its body when that line is "Historia: #N" or "PR: #N"; plus every issue labeled "trabada" or "en-pausa", open or closed.
3. vetoes: open issues labeled "historia" whose last veto comes after its last "labeled" event for "lista", with no "labeled" event for "vetada" after that veto (the label itself may be stale). The question for this veto is an issue titled "Por qué vetaste #<n>" that is open or was created after the veto; asked = it exists. reason = Hernán's first comment written after the veto, verbatim, on the story or on that question (a closing comment counts); if that question was closed with no comment of his written after the veto, reason = "(sin motivo)"; else null.
4. streaks: per milestone with vetoes, count the vetoes on its stories after the last closed issue titled "Freno por racha en <milestone>" (all of them if there is none); decisionOpen = such an issue is open.
5. inFlight: open issues with "lista" that have a local branch (git branch --list "feature/<n>-*") or an open PR from a branch feature/<n>-*; pr = the PR URL, draft = the PR is a draft.
6. toAccept: issues labeled "historia", outside milestone "M0 - Base", closed as completed, without the label "aceptada"; sha = the merge commit of the PR that closed it, or the sha in its "Mergeado en <sha>" comment. Oldest first.
7. ready: open issues with "lista", not vetoed, not in inFlight; by milestone (M1 before M2 …), then number.
8. renovate: open PRs by app/renovate, their CI (gh pr checks: green, red or pending), and asked = an issue titled "Decisión para PR #<pr>" exists, open or closed: once asked, the PR is Hernán's.
9. milestoneToReport: the earliest milestone whose "historia" issues are all closed, where every one closed as completed carries "aceptada" (one closed as not planned counts as done), and for which no issue titled "Cierre de <milestone>" exists; else null.`,
    { phase: 'Board', label: 'board', ...CHORE, schema: BOARD },
  )

phase('Board')
let board = await readBoard()
if (!board) return { action: 'halt', why: 'el tablero no se pudo leer' }
if (a.dryRun) return { action: 'dry-run', plan: decide(board), board }

// A stage cut halfway leaves the tree dirty. Nothing is lost in a stash, and the swarm goes on.
if (!board.clean) {
  const stash = await agent(
    `${HERE} The working tree is dirty on branch "${board.branch}". If a merge, rebase or cherry-pick ` +
      `is in progress, abort it (git merge --abort, git rebase --abort, git cherry-pick --abort). Then ` +
      `git stash push -u -m "enjambre: ${board.branch} <date '+%F %H:%M'>" and check that "git status ` +
      `--short" is empty. Never reset, clean or delete anything. Return stashed=true with the stash ` +
      `message as name and the files it holds (git stash show --include-untracked --name-only stash@{0}).`,
    { phase: 'Board', label: 'stash', ...CHORE, schema: STASH },
  )
  if (!stash?.stashed) return { action: 'halt', why: `árbol sucio en ${board.branch}: ${stash?.detail ?? 'el stash no se pudo hacer'}` }
  await openAviso(
    `Cambios guardados en un stash: ${stash.name}`,
    `El árbol de trabajo estaba sucio en «${board.branch}» (una etapa cortada a mitad lo deja así). ` +
      `El enjambre lo guardó con \`git stash\` y siguió; no se perdió nada.\n\nArchivos: ` +
      `${(stash.files ?? []).map((f) => `\`${f}\``).join(', ') || '(ver el stash)'}\n\nPara recuperarlos: ` +
      `\`git stash list\`, y \`git stash apply\` sobre el que se llama «${stash.name}». Si no hacen falta, ` +
      `\`git stash drop\` y cerrá este issue.`,
    'Board',
  )
  board = await readBoard()
  if (!board?.clean) return { action: 'halt', why: 'el árbol sigue sucio después del stash' }
}
const plan = decide(board)

if (plan.step === 'streak') {
  const { milestone, vetoes, decisionOpen } = plan.streak
  if (!decisionOpen) {
    const stories = board.vetoes.filter((v) => v.milestone === milestone).map((v) => `#${v.story}`)
    await openDecision(
      `Freno por racha en ${milestone}`,
      `Milestone: ${milestone}`,
      `Vetaste ${vetoes} historias de ${milestone} (${stories.join(', ')}): el proxy está prediciendo ` +
        `mal tu criterio (docs/09 §Veto). El enjambre queda parado hasta que cierres este issue; ` +
        `después te pregunta el motivo de cada veto en un issue «Por qué vetaste #N».`,
      'Veto',
    )
  }
  return { action: 'waiting', why: `freno por racha en ${milestone}` }
}

if (plan.step === 'veto') {
  phase('Veto')
  const { story, reason } = plan.veto
  if (!reason) {
    // "Veto:" and not "Historia:": the question blocks nothing if Hernán puts `lista` back first.
    await openDecision(
      `Por qué vetaste #${story}`,
      `Veto: #${story}`,
      `Le sacaste \`lista\` a #${story}. ¿Qué no te cerró? Contestá acá: va a docs/11-criterio.md para ` +
        `que el proxy no lo repita, y Producto refina la historia contra eso. Si cerrás este issue sin ` +
        `escribir nada, el veto se registra sin motivo.`,
      'Veto',
    )
    return { action: 'veto', story, outcome: 'reason asked' }
  }
  const withReason = reason !== '(sin motivo)'
  const landed = withReason
    ? await landDocs(
        `que agrega a docs/11-criterio.md el veto de #${story}`,
        `Append one line under "## Vetos" in docs/11-criterio.md, in the doc's style: today's date ` +
          `(date +%F), #${story}, Hernán's reason verbatim in «», and which line above it confirms or ` +
          `adds to. Add nothing else; the doc only grows.\nHernán's reason: ${reason}`,
        `criterio-veto-${story}`,
        'Veto',
      )
    : { done: true, url: null }
  // The work built from the vetoed text is retired, so a relabeled story is specified again.
  const recorded = await agent(
    `${HERE} Record the veto of story #${story}: ` +
      `(1) gh issue edit ${story} --remove-label vetada, then gh issue edit ${story} --add-label vetada, so the label history shows it after this veto even when an old label was still on; ` +
      `(2) if an issue titled "Por qué vetaste #${story}" is open, close it with a comment that links ${landed?.url ?? 'docs/11-criterio.md'}; ` +
      `(3) retire every branch feature/${story}-*, local and remote, never deleting its work: rename each to vetada/${story}-<the rest of its name>-<k>, with k the first number free locally and on origin (git branch -m; for a remote one, push it under the new name, then git push origin --delete the old one); ` +
      `(4) close any open PR from such a branch with the comment "Vetada por Hernán; la historia se especifica de nuevo." ` +
      `Return done=true only when the history shows "labeled vetada" after the last "unlabeled lista" and no branch feature/${story}-* is left, local or on origin; otherwise say which step failed in detail.`,
    { phase: 'Veto', label: `vetada:#${story}`, ...CHORE, schema: DONE },
  )
  if (landed?.done && recorded?.done) return { action: 'veto', story, outcome: 'recorded' }
  const parked = await failed(
    story,
    'veto',
    LIMIT.veto,
    `El veto no quedó registrado del todo: ` +
      `${landed?.done ? '' : `la línea de docs/11 no entró (${landed?.url ?? 'sin PR'}); `}` +
      `${recorded?.done ? '' : `no se pudo marcar ni retirar su rama: ${recorded?.detail ?? 'el agente no respondió'}.`}`,
    'Para que el enjambre vuelva a registrar el veto, sacale `trabada`.',
    'Veto',
  )
  return { action: 'veto', story, outcome: parked ? 'parked' : 'retry next turn' }
}

if (plan.step === 'resume') return await ship(plan.flying.story, plan.flying.draft ? 'retake-draft' : 'resume')

if (plan.step === 'accept') {
  phase('Accept')
  const { story, sha } = plan.target
  const retry = 'Para que QA la vuelva a recorrer, sacale `trabada`.'
  const qa = await agent(`Accept story #${story}, merged at ${sha ?? 'its merge commit on main'}.`, {
    phase: 'Accept',
    label: `qa:#${story}`,
    agentType: 'acceptance-qa',
    schema: QA,
  })
  if (!qa) {
    const parked = await failed(story, 'accept', LIMIT.accept, 'La aceptación no terminó: el agente de QA no devolvió nada.', retry, 'Accept')
    return { action: 'accept', story, outcome: parked ? 'parked' : 'qa died' }
  }
  const failures = [...qa.failures].sort((x, y) => severityRank[x.severity] - severityRank[y.severity])
  const [followUp, ...aboveBar] = failures.filter((f) => f.passesBar)
  const belowBar = failures.filter((f) => !f.passesBar)
  const landed = belowBar.length
    ? await landDocs(
        `que acepta lo que la aceptación de #${story} encontró bajo el umbral`,
        `Add one entry per failure to the end of docs/known-limitations.md, numbered KL-${story}-<k> ` +
          `with k counting on from the highest KL-${story}-* already there (from 1 if none), in the ` +
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
    { phase: 'Accept', label: `close:#${story}`, ...CHORE, schema: DONE },
  )
  if (!landed?.done || !closed?.done) {
    const parked = await failed(
      story,
      'accept',
      LIMIT.accept,
      `La aceptación corrió pero no cerró del todo: ` +
        `${landed?.done ? '' : `las limitaciones no entraron (${landed?.url ?? 'sin PR'}); `}` +
        `${closed?.done ? '' : 'el comentario, el seguimiento o la etiqueta aceptada no quedaron.'}`,
      retry,
      'Accept',
    )
    return { action: 'accept', story, qa: qa.summary, outcome: parked ? 'parked' : 'retry next turn' }
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
      `of the milestone and whether they are open; the decisions the swarm took in his place ` +
      `("Decisión (<fecha>, enjambre)" in docs/); incorporations to docs/03; the KL entries added in ` +
      `its PRs; its follow-ups; the stories labeled trabada or en-pausa and why; the Renovate PRs ` +
      `closed since the milestone started because they needed code (a comment whose first line is ` +
      `"<!-- enjambre:renovate-necesita-codigo -->"); each story's QA comment. End with a line that ` +
      `mentions @hergarcia. Return done=true with its URL.`,
    { phase: 'Accept', label: `cierre:${m}`, model: 'sonnet', schema: DONE },
  )
  // No issue with that title yet, so the board offers the report again next turn.
  if (!report?.done) return { action: 'waiting', why: `reporte de ${m} sin armar; se reintenta en la vuelta siguiente` }
  return { action: 'milestone-report', milestone: m, url: report.url }
}

if (plan.step === 'build') return await ship(plan.next.story, 'build')

phase('Write')
const po = await agent(`Mode: next. Parked, or blocked by an open decision, skip them: ${JSON.stringify(board.blocked)}.`, {
  phase: 'Write',
  label: 'po:next',
  agentType: 'product-owner',
  schema: PO,
})
if (po?.story && board.blocked.includes(po.story)) {
  return { action: 'write', story: po.story, outcome: 'picked a blocked story; nothing done' }
}
if (po?.knownLimitation) {
  const landed = await landDocs(
    `que agrega la limitación aceptada de #${po.story}`,
    `Add this entry to the end of docs/known-limitations.md, in the doc's format, keeping its number ` +
      `KL-${po.story}-<k>:\n${po.knownLimitation}`,
    `kl-${po.story}`,
    'Write',
  )
  // The follow-up closes only once its limitation is in main, so nothing points at one that is not.
  const closed = landed?.done
    ? await agent(
        `${HERE} If issue #${po.story} is open, close it as not planned with a comment citing the KL entry ` +
          `it became in docs/known-limitations.md (${landed.url ?? 'already in main'}). Return done=true when it is closed.`,
        { phase: 'Write', label: `close:#${po.story}`, ...CHORE, schema: DONE },
      )
    : null
  if (closed?.done) return { action: 'write', story: po.story, outcome: 'known-limitation' }
  const parked = await failed(
    po.story,
    'write',
    LIMIT.write,
    `La limitación que acepta no quedó: ${landed?.done ? 'el issue no se pudo cerrar.' : `el PR no entró (${landed?.url ?? 'sin PR'}).`}`,
    'Para que el enjambre lo vuelva a intentar, sacale `trabada`.',
    'Write',
  )
  return { action: 'write', story: po.story, outcome: parked ? 'known-limitation parked' : 'known-limitation retry next turn' }
}
if (po && (po.status === 'prepared' || po.status === 'refined') && po.story) {
  const story = po.story
  let verdict = null
  let rejects = 0
  let stuck = null
  for (let round = 1; round <= 4 && !stuck; round++) {
    verdict = await agent(`story ${story}`, {
      phase: 'Write',
      label: `proxy:#${story}:r${round}`,
      agentType: 'hernan-proxy',
      schema: PROXY,
    })
    if (!verdict || verdict.verdict === 'approve') break
    if (verdict.verdict === 'reject') {
      if (++rejects === 2) break
      await agent(`Mode: refine ${story}. Findings: ${JSON.stringify(verdict.reasons)}`, {
        phase: 'Write',
        label: `po:refine:#${story}`,
        agentType: 'product-owner',
        schema: PO,
      })
      continue
    }
    // What used to wait for Hernán: the proxy picks the option he would, Producto records it, and
    // the next round judges the story with the decision in it.
    const took = await agent(`Mode: decide ${story}. Verdict: ${JSON.stringify(verdict)}`, {
      phase: 'Write',
      label: `po:decide:#${story}`,
      agentType: 'product-owner',
      schema: PO,
    })
    if (took?.status !== 'decided') stuck = `Producto no pudo registrar la decisión que tomó el proxy: ${took?.detail ?? 'no respondió'}`
    else if (took.docChange) {
      const landed = await landDocs(`que registra una decisión que el enjambre tomó en #${story}`, took.docChange, `decision-${story}-${round}`, 'Write')
      if (!landed?.done) stuck = `la decisión no entró a docs/ (${landed?.url ?? 'sin PR'})`
    }
  }
  if (!verdict) return { action: 'write', story, outcome: 'proxy died; retry next turn' }
  if (verdict.verdict === 'approve' && !stuck) {
    const labeled = await agent(`Mode: label ${story}. Verdict: ${JSON.stringify(verdict)}`, {
      phase: 'Write',
      label: `po:label:#${story}`,
      agentType: 'product-owner',
      schema: PO,
    })
    if (labeled?.status === 'labeled') return { action: 'write', story, outcome: 'labeled' }
    stuck = `tu proxy la aprobó, pero Producto no le pudo poner \`lista\`: ${labeled?.detail ?? 'no respondió'}`
  }
  // Anything short of `lista` is paused once instead of cycling every turn; Producto moves on.
  const reasons = (verdict.reasons ?? []).map((r) => `- ${r.criterion}: ${r.evidence}`).join('\n')
  const why =
    stuck ??
    (verdict.verdict === 'reject'
      ? `Tu proxy rechazó #${story} dos veces, aun después de refinarla:\n${reasons}`
      : `Tu proxy siguió pidiendo decisiones sobre #${story} después de cuatro rondas: ${verdict.question ?? verdict.summary}`)
  await park(story, 'en-pausa', why, 'Para que Producto la retome, sacale `en-pausa` o comentá qué le falta.', 'Write')
  return { action: 'write', story, outcome: 'paused', detail: verdict.summary }
}
if (po && po.status !== 'nothing-to-do') return { action: 'write', story: po.story, outcome: po.status, detail: po.detail }

phase('Maintain')
// Once asked, a Renovate PR that changes the rules waits for Hernán's `reglas-aprobadas`.
const renovateWork = board.renovate.filter((r) => r.ci !== 'pending' && !r.asked)
const alreadyAsked = board.renovate.filter((r) => r.asked).map((r) => r.pr)
const mode = renovateWork.length ? 'renovate' : 'reopen'
const maint = await agent(`Mode: ${mode}.${mode === 'renovate' && alreadyAsked.length ? ` Already asked Hernán about, leave them out: ${JSON.stringify(alreadyAsked)}.` : ''}`, { phase: 'Maintain', label: `maint:${mode}`, agentType: 'maintainer', schema: MAINT })
for (const x of (maint?.needsHernan ?? []).filter((x) => x.pr)) {
  await openDecision(
    `Decisión para PR #${x.pr}`,
    `PR: #${x.pr}`,
    `Renovate #${x.pr} cambia lo que juzga a los agentes: necesita tu \`reglas-aprobadas\`. ${x.why ?? ''}\n\n` +
      `Desde ahora el PR es tuyo: mergealo o cerralo cuando lo resuelvas; el enjambre no lo vuelve a tocar.`,
    'Maintain',
    true,
  )
}
// A limitation whose condition is met becomes a follow-up, and Producto takes it like any other.
const reopen = maint?.reopen ?? []
const followUps = reopen.length
  ? await agent(`Mode: reopen. Limitations whose reopening condition is met: ${JSON.stringify(reopen)}`, {
      phase: 'Maintain',
      label: 'po:reopen',
      agentType: 'product-owner',
      schema: PO,
    })
  : null
return { action: mode === 'renovate' ? 'maintain' : 'idle', maintenance: maint, followUps }
