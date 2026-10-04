export const meta = {
  name: 'director-cloud',
  description:
    'The Director trimmed for a Claude Code cloud session: prepare the container, then resume the story in flight, build the next ready one, or write the next story',
  whenToUse:
    'In a cloud session with SWARM=1 and the repo attached, from /loop or a routine: every run is one step. args: {repo?: absolute path of the checkout (default /home/user/adopciones-mvp), dryRun?: true}.',
  phases: [{ title: 'Prep' }, { title: 'Board' }, { title: 'Build' }, { title: 'Write' }],
}

// What it leaves out on purpose: recording vetoes and the streak brake, acceptance, the milestone
// report and Renovate. None of them is lost: the full Director reads all of them from the board, so
// whatever piles up here it catches up on its next local turn. A vetoed story has no `lista`, so it is
// neither resumed nor built here. A failed build is parked at once, without retries: Hernán removes
// `trabada` to retry it.

const a = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const REPO = a.repo ?? '/home/user/adopciones-mvp'
const HERE = `Work in the repo at ${REPO}, on main. Your final message is parsed: return only the JSON asked for.`
const strings = { type: 'array', items: { type: 'string' } }
const nullable = (type) => ({ type: [type, 'null'] })

const PREP = {
  type: 'object',
  required: ['ready', 'swarm'],
  properties: { ready: { type: 'boolean' }, swarm: { type: 'boolean' }, detail: { type: 'string' } },
}

const BOARD = {
  type: 'object',
  required: ['clean', 'blocked', 'inFlight', 'ready'],
  properties: {
    clean: { type: 'boolean' },
    stash: nullable('string'),
    blocked: { type: 'array', items: { type: 'integer' } },
    inFlight: {
      type: 'array',
      items: {
        type: 'object',
        required: ['story', 'draft'],
        properties: { story: { type: 'integer' }, pr: nullable('string'), draft: { type: 'boolean' } },
      },
    },
    ready: { type: 'array', items: { type: 'integer' } },
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

// `trabada` goes on in the same command that takes `lista` off, so guard-git reads it as parking.
const park = (story, label, why, retry, phaseTitle) =>
  agent(
    `${HERE} Park story #${story}: gh issue edit ${story} --add-label ${label} --remove-label lista ` +
      `(if it no longer carries lista, just --add-label ${label}). Leave its branches and PRs as they are. ` +
      `Then make sure there is an issue labeled \`aviso\` titled exactly "${label === 'trabada' ? 'Trabada' : 'En pausa'}: #${story}", ` +
      `with the story's milestone: if one is open, add the text below as a comment; otherwise create it ` +
      `(gh issue create --label aviso --title ... --body-file <file under .artifacts/director/>). ` +
      `Return done=true with the aviso URL.\n\n${why}\n\nEl enjambre la saltea y sigue con lo demás. ${retry}`,
    { phase: phaseTitle, label: `${label}:#${story}`, effort: 'low', schema: DONE },
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
  log(`${action === 'build' ? 'Construyo' : 'Retomo'} #${story}`)
  const outcome = shipOutcome(await workflow('ship-batch', { stories: [story], repo: REPO }))
  if (outcome.status === 'merged' || outcome.vetoed) return { action, story, outcome }
  await park(
    story,
    'trabada',
    outcome.status === 'draft-pr'
      ? `#${story} quedó en borrador; el PR dice qué falla: ${outcome.pr}`
      : `El pipeline de #${story} terminó en «${outcome.status}»: ${outcome.detail}${outcome.pr ? ` (PR ${outcome.pr})` : ''}`,
    'Para reintentarla, sacale `trabada` y ponele `lista`; para achicarla, comentá la historia.',
    'Build',
  )
  return { action, story, outcome, parked: true }
}

if (!a.dryRun) {
  phase('Prep')
  const prep = await agent(
    `${HERE} Run "bash scripts/cloud-up.sh" and then "echo \\"SWARM=$SWARM\\"". ready = the script ` +
      `ended with "cloud-up: ready"; swarm = SWARM is exactly 1. On failure put the script's last error ` +
      `line in detail.`,
    { phase: 'Prep', label: 'cloud-up', effort: 'low', schema: PREP },
  )
  if (!prep?.ready) return { action: 'halt', why: `el contenedor no quedó listo: ${prep?.detail ?? 'el agente no respondió'}` }
  // Without SWARM=1 the hooks that keep the swarm off its own rules stay off.
  if (!prep.swarm) return { action: 'halt', why: 'falta SWARM=1 en las variables del entorno de la nube' }
}

phase('Board')
const board = await agent(
  `${HERE} Read the swarm's board and report it.${a.dryRun ? ' This is a dry run: change nothing at all; read main as origin/main after a git fetch.' : ''}
1. clean: "git status --short" is empty.${a.dryRun ? '' : ` If not, abort any merge, rebase or cherry-pick in progress, then git stash push -u -m "enjambre: <branch> <date '+%F %H:%M'>"; stash = that message; clean = "git status --short" is now empty. Never reset, clean or delete anything. If clean, "git checkout main && git pull --ff-only origin main".`}
2. blocked: for every open issue labeled "decision", the number N in the first line of its body when that line is "Historia: #N" or "PR: #N"; plus every issue labeled "trabada" or "en-pausa", open or closed.
3. inFlight: open issues with "lista", not blocked, that have a branch feature/<n>-* on origin (git ls-remote --heads origin "feature/<n>-*") or locally, or an open PR from such a branch; pr = the PR URL, draft = the PR is a draft.
4. ready: open issues with "lista", not blocked, not in inFlight; by milestone (M1 before M2 …), then number.`,
  { phase: 'Board', label: 'board', effort: 'low', schema: BOARD },
)
if (!board) return { action: 'halt', why: 'el tablero no se pudo leer' }
if (!board.clean) return { action: 'halt', why: `el árbol sigue sucio: ${board.detail ?? ''}` }

const flying = board.inFlight.find((f) => !board.blocked.includes(f.story))
const next = board.ready.find((n) => !board.blocked.includes(n))
if (a.dryRun) {
  const plan = flying ? { step: 'resume', flying } : next ? { step: 'build', story: next } : { step: 'write' }
  return { action: 'dry-run', plan, board }
}
const stashed = board.stash ? { stash: board.stash } : {}

if (flying) return { ...stashed, ...(await ship(flying.story, flying.draft ? 'retake-draft' : 'resume')) }
if (next) return { ...stashed, ...(await ship(next, 'build')) }

phase('Write')
const po = await agent(`Mode: next. Parked, or blocked by an open decision, skip them: ${JSON.stringify(board.blocked)}.`, {
  phase: 'Write',
  label: 'po:next',
  agentType: 'product-owner',
  schema: PO,
})
if (!po || po.status === 'nothing-to-do') return { ...stashed, action: 'idle' }
if (po.story && board.blocked.includes(po.story)) {
  return { action: 'write', story: po.story, outcome: 'picked a blocked story; nothing done' }
}

if (po.knownLimitation) {
  const landed = await landDocs(
    `que agrega la limitación aceptada de #${po.story}`,
    `Add this entry to the end of docs/known-limitations.md, in the doc's format, keeping its number ` +
      `KL-${po.story}-<k>:\n${po.knownLimitation}`,
    `kl-${po.story}`,
    'Write',
  )
  // The follow-up closes only once its limitation is in main, so nothing points at one that is not.
  if (!landed?.done) return { action: 'write', story: po.story, outcome: 'known-limitation not landed; retry next turn', url: landed?.url ?? null }
  await agent(
    `${HERE} If issue #${po.story} is open, close it as not planned with a comment citing the KL entry ` +
      `it became in docs/known-limitations.md (${landed.url ?? 'already in main'}). Return done=true when it is closed.`,
    { phase: 'Write', label: `close:#${po.story}`, effort: 'low', schema: DONE },
  )
  return { action: 'write', story: po.story, outcome: 'known-limitation' }
}

if ((po.status !== 'prepared' && po.status !== 'refined') || !po.story) {
  return { action: 'write', story: po.story, outcome: po.status, detail: po.detail }
}

// The proxy judges up to three times: a reject is refined once, a decision is taken by Producto and
// judged again. Anything short of approval is paused, so a story does not cycle every turn.
const story = po.story
let verdict = null
let refined = false
let stuck = null
for (let round = 1; round <= 3 && !stuck; round++) {
  verdict = await agent(`story ${story}`, {
    phase: 'Write',
    label: `proxy:#${story}:r${round}`,
    agentType: 'hernan-proxy',
    schema: PROXY,
  })
  if (!verdict || verdict.verdict === 'approve') break
  if (verdict.verdict === 'reject') {
    if (refined) break
    refined = true
    await agent(`Mode: refine ${story}. Findings: ${JSON.stringify(verdict.reasons)}`, {
      phase: 'Write',
      label: `po:refine:#${story}`,
      agentType: 'product-owner',
      schema: PO,
    })
    continue
  }
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
const reasons = (verdict.reasons ?? []).map((r) => `- ${r.criterion}: ${r.evidence}`).join('\n')
const why =
  stuck ??
  (verdict.verdict === 'reject'
    ? `Tu proxy rechazó #${story} dos veces, aun después de refinarla:\n${reasons}`
    : `Tu proxy siguió pidiendo decisiones sobre #${story} después de tres rondas: ${verdict.question ?? verdict.summary}`)
await park(story, 'en-pausa', why, 'Para que Producto la retome, sacale `en-pausa` o comentá qué le falta.', 'Write')
return { action: 'write', story, outcome: 'paused', detail: verdict.summary }
