#!/usr/bin/env node
// Stryker over the source files that have a sibling test: the ones changed since main by default,
// all of them with --all. A changed test drags its subject in (foo.test.ts → foo.ts).
//   node scripts/mutation.mjs [--base <ref>] [--all]
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const all = args.includes("--all");
const baseIdx = args.indexOf("--base");
const requestedBase = baseIdx >= 0 ? args[baseIdx + 1] : "main";

const MUTABLE = /^src\/.*\.(ts|tsx)$/;
const EXCLUDED = [
  /\.test\.(ts|tsx)$/,
  /\.d\.ts$/,
  /^src\/app\//,
  /^src\/components\/ui\//,
  /^src\/lib\/supabase\/types\.ts$/,
  /^src\/styles\//,
];

const slash = (p) => p.replaceAll(String.fromCharCode(92), "/");
const subjectOf = (test) => test.replace(/\.test\.(ts|tsx)$/, ".$1");
const testOf = (src) => src.replace(/\.(ts|tsx)$/, ".test.$1");
const hasTest = (src) => existsSync(testOf(src));
const inScope = (f) => MUTABLE.test(f) && !EXCLUDED.some((re) => re.test(f)) && hasTest(f);

function git(...a) {
  return execFileSync("git", a, { encoding: "utf8" });
}
function stryker(files, label) {
  if (!files.length) {
    console.log(`mutation: no tested source ${label} — nothing to run`);
    process.exit(0);
  }
  console.log(`mutation: ${files.length} tested file(s) ${label}\n  ${files.join("\n  ")}`);
  const r = spawnSync("pnpm", ["exec", "stryker", "run", "--mutate", files.join(",")], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  process.exit(r.status ?? 1);
}

if (all) {
  const tests = readdirSync("src", { recursive: true })
    .map((p) => slash(join("src", String(p))))
    .filter((p) => /\.test\.(ts|tsx)$/.test(p));
  const files = [...new Set(tests.map(subjectOf))].filter(inScope).sort();
  stryker(files, "in src/");
}

let base = requestedBase;
try {
  git("rev-parse", "--verify", "--quiet", base);
} catch {
  base = "main";
}
const mergeBase = git("merge-base", base, "HEAD").trim();
const changed = [
  git("diff", "--name-only", "--diff-filter=AMR", `${mergeBase}..HEAD`),
  git("diff", "--name-only", "--diff-filter=AMR", "HEAD"),
  git("ls-files", "--others", "--exclude-standard"),
]
  .join("\n")
  .split("\n")
  .map((s) => slash(s.trim()))
  .filter(Boolean);

const subjects = new Set(changed.map((f) => (/\.test\.(ts|tsx)$/.test(f) ? subjectOf(f) : f)));
stryker([...subjects].filter((f) => existsSync(f) && inScope(f)).sort(), `changed since ${base}`);
