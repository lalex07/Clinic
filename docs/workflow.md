# Build → Test → Update pipeline

An internal working doc (not served). Describes the three-agent workflow for making changes to the
大豐耳鼻喉科聯合診所 site, and the one rule that shapes everything else: **the human does all commits.**

Run it with `/feature <task>`.

Files:

| Piece | Path | Role |
| --- | --- | --- |
| Orchestrator | `.claude/skills/feature/SKILL.md` | The LEAD's instructions — drives the loop |
| Builder | `.claude/agents/builder.md` | Implements the scoped change |
| Tester | `.claude/agents/tester.md` | Read-only QA gate |
| Updater | `.claude/agents/updater.md` | `progress.md` + commit handoff |

---

## The shape of it

```
/feature <task>
   │
   ├─ 1. scope it            (LEAD; optionally /autoplan or /office-hours; asks if ambiguous)
   ├─ 2. builder             writes code, runs generators → report + "WHAT TO TEST"
   ├─ 3. tester              audit + byte gate + browser QA + RLS → VERDICT
   │
   ├─ 4. DEFECTS ────────────► back to builder with the defect list → tester again
   │                           (cap 3 rounds, then surface to the human)
   │
   ├─ 5. MANUAL VERIFICATION NEEDED ──► STOP. Show the checklist. WAIT for the human.
   │
   └─ 6. PASS + human confirmed
          └─ updater          progress.md, CLAUDE.md (if a rule changed), generators, secret scan
                └─ presents:  git status + diff --stat + proposed `git add` / `git commit`
                                 │
                                 └─► THE HUMAN COMMITS AND PUSHES. Pipeline ends.
```

## Why it's shaped this way

Two facts about Claude Code drive the design:

1. **There is no built-in "loop until it passes."** A subagent runs to completion and returns; it can't
   re-invoke a sibling. So the **LEAD** (the `/feature` skill) owns the loop — it re-spawns the builder
   with the tester's defect list and re-spawns the tester, round after round, up to a cap of 3.
2. **A subagent cannot pause mid-run to ask a human anything.** So anything needing a human — visual
   judgment, a real MFA login, a real upload, 院長 sign-off — cannot be "handled inside" the tester. The
   tester instead **returns a checklist** and the LEAD halts the pipeline and waits for the human.

The 3-round cap exists so a change that isn't converging reaches a human instead of burning rounds.
Reaching the cap is a legitimate outcome, not a failure to hide.

## Roles

### Builder — writes code
Tools: Read / Write / Edit / Bash / Glob / Grep + Supabase MCP + Skill. Model: opus.

Implements **one scoped task**, smallest correct change, matching the existing house style. Enforces
`CLAUDE.md` (design rules, file organization) and `site-spec.md` §九 as it writes. **Never invents**
doctor, clinical, or §九-sensitive copy — leaves visible `〔待補〕` placeholders and flags them; inserts
院長-approved copy verbatim. If content or the DB changed, re-runs the generators so `team.html`,
`news.html`, `faq.html` / `faq-*.html`, `assets/search-index.js`, and `sitemap.xml` stay in sync.

Forbidden: any git write command; editing `progress.md` (the updater owns it); opportunistic refactors.

Output: files changed, Supabase schema/RLS changes, byte-gate result, and a precise **WHAT TO TEST**
list — including anything it could not verify headlessly, so the tester escalates it.

### Tester — the QA gate
Tools: Read / Grep / Glob / Bash + Supabase MCP + Skill. **No Write, no Edit.** Model: opus.

Four checks:

- **(a) clinic-audit, report-only** — §九 compliance, the `CLAUDE.md` design rules, WCAG AA. New findings
  block; pre-existing ones are noted separately.
- **(b) the byte-identical gate** — runs all three generators and inspects `git diff`. Pages whose content
  didn't change must regenerate byte-for-byte unchanged; churn elsewhere is a FAIL. Because running the
  generators mutates files, the tester **snapshots the tree first** (`git diff` → patch files), and only
  then restores with `git checkout -- .` followed by re-applying the patch — the builder's work is
  *uncommitted*, so a bare `git checkout -- .` would destroy it. It verifies `git status --porcelain`
  matches the snapshot, and escalates loudly if it doesn't.
- **(c) headless-browser QA** — may use `/qa-only` (or `/qa`, whose fix phase is inert here). Loads the
  affected pages over `http://localhost:8000` (never `file:///`), checks console errors and CSP
  violations, desktop 1280+ **and** mobile 390/375, takes screenshots, verifies the header still fits one
  line and swapped-in images stay inside their `.photo-zone`.
- **(d) RLS / security invariants** — via Supabase MCP, read-only probes: anon can't read drafts, anon
  can't write, admin writes gated on `is_admin_mfa()` (aal2) with reads on `is_admin()`, no secrets in
  tracked files, `/admin/` still `Disallow`ed and out of the nav/sitemap/search index.

It may also run `/review` for a staff-engineer read of the diff — **findings only, auto-fixes are never
applied.**

Verdict is exactly one of **DEFECTS** (precise `file:line` list with severity and repro),
**MANUAL VERIFICATION NEEDED** (crisp human checklist), or **PASS**. It never passes unreviewed medical
copy, never commits, and leaves the working tree clean.

### Updater — trailing files, then hand off
Tools: Read / Write / Edit / Bash / Glob / Grep + Supabase MCP + Skill. Model: opus.

Runs **only** after the tester PASSES *and* the human confirms any manual items, and **never in parallel
with the builder**. Writes the `progress.md` session note (`## 🗓️ YYYY-MM-DD (session N) — 標題`, newest
first, Traditional Chinese, with the standing 逐位元組閘門 / clinic-audit / 未動 / 後續 bullets, plus a
record of what the human manually confirmed — that's the medical-copy audit trail). Updates `CLAUDE.md`
only if a **standing rule** changed. Re-runs the generators to confirm the byte gate. Scans for secrets.

Then it **stops** and prints `git status`, `git diff --stat`, the no-secrets confirmation, and a proposed
`git add <explicit files>` + `git commit -m …`.

## Human-commits policy

**No agent and no step in this pipeline ever runs `git add`, `git commit`, or `git push`, and no agent
opens a PR.** Agents prepare changes and report; the human reviews the diff and commits. Read-only git
(`status`, `diff`, `log`) is the only git surface the agents have. The one exception — the tester's
scoped `git checkout -- .` restore in step (b) — exists solely to *undo* the tester's own generator run,
is wrapped in a snapshot-and-reapply so it can't eat the builder's work, and is a hard-stop escalation if
the tree doesn't come back identical.

This is deliberate. Commits are where an unreviewed §九 violation or an unapproved piece of medical copy
would become published history on a live healthcare site. A human reads the diff first, every time.

## Hard gates

Nothing reaches the updater until all three hold:

1. **§九** — Taiwan medical-advertising compliance (`site-spec.md`, section 九 「醫療廣告合規檢查表」):
   no 保證/最/根治/唯一/第一/必須/一定要, no fees, no efficacy claims, no patient testimonials, footer
   disclaimer intact.
2. **Byte-identical generators** — unchanged content regenerates byte-for-byte unchanged.
3. **clinic-audit** — no new compliance, design-rule, or WCAG AA findings.

Plus the standing constraints: builder and updater never run in parallel; medical copy never ships
without 院長 sign-off; no agent commits.

## Notes

- Both agents that write files are single-threaded by design. If you ever hand-run these agents outside
  `/feature`, keep that property.
- The generators need `SUPABASE_URL` / `SUPABASE_ANON_KEY` from the gitignored `.env`. If a generator
  can't run, the byte gate is **NOT VERIFIED** — never inferred as a pass.
- gstack skills used here are optional accelerants: `/autoplan` and `/office-hours` for scoping,
  `/qa-only` (or `/qa`) for the browser sweep, `/review` for a diff read. The project's own
  `clinic-audit` skill is the one that is mandatory.
