#!/usr/bin/env node
// PreToolUse hook: in the swarm session (SWARM=1) nothing writes what judges the agents
// (scripts/protected/rules.mjs, docs/09 §Las reglas no se tocan solas). Exit 2 = block.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { isCommit, protectedWrites } from "../../scripts/protected/bash.mjs";
import { needsApproval, ruleFor } from "../../scripts/protected/rules.mjs";

if (process.env.SWARM !== "1") process.exit(0);

const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const attempt = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};
const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : null);

function rootOf(path) {
  let dir = path;
  while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir);
  return attempt(() => git(dir, "rev-parse", "--show-toplevel").trim());
}

function block(reasons) {
  process.stderr.write(
    "guard-rules: la sesión del enjambre no cambia lo que juzga a los agentes " +
      "(docs/09 §Las reglas no se tocan solas):\n" +
      reasons.map((r) => `  · ${r}\n`).join("") +
      "Si hace falta cambiarlo, pedilo en un issue `decision` y seguí con lo que no depende de eso.\n",
  );
  process.exit(2);
}

// null when the Edit would fail on its own: the tool reports that better than this hook.
function afterEdit(before, { old_string: from = "", new_string: to = "", replace_all: all }) {
  if (before === null) return from === "" ? to : null;
  if (!before.includes(from)) return null;
  if (all) return before.split(from).join(to);
  const at = before.indexOf(from);
  return before.slice(0, at) + to + before.slice(at + from.length);
}

function checkFile(input, cwd) {
  const tool = input.tool_name;
  const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (!target) return;
  const file = isAbsolute(target) ? target : resolve(cwd, target);
  const root = rootOf(dirname(file));
  if (!root) return;
  const name = relative(root, file);
  if (name.startsWith("..") || !ruleFor(name)) return;
  if (tool === "NotebookEdit") block([`${name} — juzga a los agentes`]);
  const before = read(file);
  const after = tool === "Write" ? String(input.tool_input.content ?? "") : afterEdit(before, input.tool_input);
  if (after === null) return;
  const reason = needsApproval(name, before, after);
  if (reason) block([reason]);
}

// Whatever the Bash heuristic missed shows up here, in what is about to be committed.
function checkCommit(root) {
  if (attempt(() => git(root, "rev-parse", "-q", "--verify", "MERGE_HEAD"))) return;
  const names = (attempt(() => git(root, "diff", "HEAD", "--name-only", "--no-renames")) ?? "")
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n && ruleFor(n));
  const reasons = names.flatMap((name) => {
    const before = attempt(() => git(root, "show", `HEAD:${name}`));
    const staged = attempt(() => git(root, "show", `:${name}`));
    return [needsApproval(name, before, staged), needsApproval(name, before, read(join(root, name)))];
  });
  const found = [...new Set(reasons.filter(Boolean))];
  if (found.length) block(found);
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  const input = attempt(() => JSON.parse(raw || "{}")) ?? {};
  const cwd = input.cwd ?? process.cwd();
  if (input.tool_name === "Bash") {
    const command = String(input.tool_input?.command ?? "");
    const root = rootOf(cwd);
    if (!root) process.exit(0);
    const writes = protectedWrites(command, root);
    if (writes.length) block(writes.map((w) => `${w} — el comando lo escribiría`));
    if (isCommit(command)) checkCommit(root);
  } else {
    checkFile(input, cwd);
  }
  process.exit(0);
});
