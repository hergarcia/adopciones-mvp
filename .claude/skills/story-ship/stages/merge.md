# Stage: Merge

Squash-merge a green PR into `main` and leave the checkout on the updated `main`. Only the
batch orchestrator runs this stage; `/story-ship` stops at the PR. A merge that cannot be
confirmed is not a merge.

## Input

PR number or URL, story number, branch.

## Steps, in order, never skipping one

1. **Inspect.** `gh pr view <#> --json state,isDraft,mergeable,mergeStateStatus,baseRefName,headRefName,statusCheckRollup`.
   Require: `state` OPEN, `isDraft` false, `baseRefName` `main`, `mergeable` not
   `CONFLICTING`, and every required check in `statusCheckRollup` concluded `SUCCESS` (a
   `SKIPPED` check is neutral, never a pass for a required one). Anything else →
   `merged: false` with the detail; touch nothing.
2. **Merge.** `gh pr merge <#> --squash --delete-branch`. A non-zero exit does not mean it
   failed: check `gh pr view <#> --json state,mergeCommit`; the local branch cleanup can fail
   after the merge already landed. Only if `state` is still OPEN, try once more with
   `gh api -X PUT repos/:owner/:repo/pulls/<#>/merge -f merge_method=squash`.
   Never `--admin`, never force, never rebase or edit the PR.
3. **Confirm.** `state` MERGED; take `mergeCommit.oid`. Then
   `git checkout main && git pull --ff-only origin main`; `git branch -D <branch>` if it still
   exists locally; `git rev-parse HEAD` equals the merge commit; `git status --short` is empty.
4. **The story is closed.** `gh issue view <n> --json state` is CLOSED (the PR's `Closes`);
   if not, `gh issue close <n> --comment "Mergeado en <sha>"`.
5. **No deploy.** Nothing is hosted until the MVP; `main` is validated locally with `/run-app`.
   Report the sha; the post-batch checklist tells Hernán to walk the build.

## Output

```json
{
  "merged": true,
  "sha": "abc1234",
  "detail": "why it was not merged, or anything odd on the way"
}
```
