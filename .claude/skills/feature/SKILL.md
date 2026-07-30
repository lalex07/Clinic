---
name: feature
description: Run a scoped change through this project's build → test → update pipeline (builder → tester → updater), looping on defects and stopping for human manual verification. Invoke as /feature <task> when the user wants a clinic-site change implemented end-to-end under the project's gates (§九 compliance, byte-identical generators, clinic-audit) with the human doing the final commit.
---

# /feature — build → test → update, human commits

You are the **LEAD**. You drive the loop; the subagents do the work. Claude Code has no built-in
"loop until pass" and no way for a subagent to pause mid-run for a human — so *you* re-spawn agents,
*you* enforce the gates, and *you* surface manual-verification stops to the human and wait.

Roles are in `.claude/agents/` and documented in `docs/workflow.md`:
**builder** (writes code) → **tester** (read-only QA gate) → **updater** (progress.md + handoff).

## Absolute rules

- **No agent commits. You do not commit.** No `git add`, `git commit`, `git push`, or PR at any step,
  by any agent, including you. The pipeline ends by handing the human a proposed commit command.
- **builder and updater NEVER run in parallel** — they both write files, and parallel writes to the same
  file lose work silently. One at a time, always. Never spawn two writing agents in one message.
- **tester makes no lasting changes** and must leave the working tree exactly as it found it.
- **Hard gates, all three must hold before the updater runs:** §九 medical-advertising compliance,
  the byte-identical generator gate, and clinic-audit.
- **Never publish medical copy without 院長 sign-off.** New or edited patient-facing medical text is a
  mandatory human stop, no matter how clean the automated checks are.

## Step 1 — sharpen the scope

Read `CLAUDE.md`, the relevant part of `site-spec.md`, and the top of `progress.md`. Turn the user's
request into a scoped plan: what changes, which files, what "done" looks like, what is explicitly out of
scope. Keep it short — a few bullets.

Optionally use `Skill(autoplan)` for an auto-reviewed plan, or `Skill(office-hours)` to pressure-test a
vague or ambitious request. Skip both for a small, obvious change.

If two readings of the request would produce materially different work, **ask the user once** before
spawning anything. Otherwise state your interpretation and proceed.

## Step 2 — spawn the builder

One `Agent` call, `subagent_type: "builder"`, run synchronously (`run_in_background: false`) — you need
its result before the next step. Give it: the scoped plan, the exact files/pages in scope, what's out of
scope, and any 院長-approved copy **verbatim**.

Relay nothing to the user yet. Capture the builder's report — especially its **WHAT TO TEST** list.

## Step 3 — spawn the tester

One `Agent` call, `subagent_type: "tester"`, synchronous. Pass it the builder's full report (scope,
files changed, Supabase changes, WHAT TO TEST) and remind it: report-only, restore the tree, no commits.

## Step 4 — defects → loop back

If the verdict is **DEFECTS**: spawn the **builder** again (synchronous, never alongside the tester or
updater) with the defect list verbatim plus the original scope, then spawn the **tester** again. Repeat.

**Cap: 3 build→test rounds.** If it still fails after the third tester run, STOP and hand the human the
remaining defect list, what was tried each round, and your read of why it isn't converging. Do not keep
looping and do not lower the bar to force a pass.

## Step 5 — MANUAL VERIFICATION NEEDED → stop and wait

If the verdict is **MANUAL VERIFICATION NEEDED**, the pipeline **halts here**. Show the user:
- what the automated checks covered and their results,
- the tester's checklist verbatim, as checkboxes,
- exactly what you'll do once they confirm.

Then **end your turn and wait.** Do not spawn the updater, do not assume the checks passed, do not
"proceed under the assumption". Common items: visual/aesthetic judgment, real MFA login to `/admin/`,
real image upload, 院長 medical-copy sign-off, anything needing real credentials or a device.

If the user comes back with problems instead of a confirmation, treat them as defects and return to
step 4 (the 3-round cap counts from there).

## Step 6 — tester PASS + human confirmed → spawn the updater

Only when the tester PASSED **and** (if step 5 happened) the human explicitly confirmed. One `Agent`
call, `subagent_type: "updater"`, synchronous, alone. Tell it: the scope, everything the builder
changed, what the tester verified, and what the human manually confirmed (so it lands in the session
note as the audit trail).

Then present to the user:
- a short summary of what changed,
- `git status` + `git diff --stat` as the updater reported them,
- the byte-gate and secret-scan results,
- the **proposed `git add …` + `git commit -m …`** command, clearly labelled as theirs to run,
- anything still open (〔待補〕 placeholders, pending 院長 sign-off, follow-ups).

**The pipeline ENDS there.** The human reviews, commits, and pushes. You do not.

## Reporting as you go

After each stage, tell the user in one or two lines what happened (`builder: 3 files changed` /
`tester: 2 defects, round 2`). Subagent reports are not shown to the user — relay what matters, don't
dump the whole thing. Never fabricate a stage's result: if an agent hasn't returned, say it's running.
