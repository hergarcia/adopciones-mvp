#!/usr/bin/env node
// PreToolUse hook for Bash: blocks the git commands the pipeline never allows (exit 2 = block).
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw || "{}");
  } catch {
    process.exit(0);
  }
  if (input.tool_name !== "Bash") process.exit(0);
  const command = String(input.tool_input?.command ?? "");

  const rules = [
    [/\bgit\s+push\b.*(\s--force\b|\s-f\b|\s--force-with-lease\b)/, "force push is never allowed"],
    [/\b(git\s+(commit|push|merge)\b.*\s--no-verify\b)/, "--no-verify skips the hooks; fix the failure instead"],
    [/\bgh\s+pr\s+merge\b.*\s--admin\b/, "gh pr merge --admin bypasses branch protection"],
    [/\bgit\s+push\b(?!.*--delete)(?=.*\b(origin\s+)?(main|HEAD:main|HEAD:refs\/heads\/main)\b)/, "direct push to main; open a PR"],
    [/\bgit\s+reset\s+--hard\b/, "reset --hard wipes the working tree; stash or commit instead"],
    [/\bgit\s+clean\b.*\s-[a-zA-Z]*f/, "git clean -f deletes untracked files; list them first"],
  ];

  // Each segment of a compound command is checked, so `git fetch && git push --force` is caught.
  const segments = command.split(/&&|\|\||;|\n/).map((s) => s.trim());
  for (const segment of segments) {
    for (const [re, reason] of rules) {
      if (re.test(segment)) {
        process.stderr.write(`guard-git: blocked "${segment}" — ${reason}.\n`);
        process.exit(2);
      }
    }
  }
  process.exit(0);
});
