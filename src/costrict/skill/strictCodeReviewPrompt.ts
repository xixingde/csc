const SKILL_MD = `---
name: strict-codereview
description: Run a strict, language-aware code review focused on maintainability, abstraction quality, architectural drift, large files, spaghetti branching, type boundaries, and actionable HTML reports. Use for strict code review, deep code quality audit, maintainability review, architecture review, PR review, or when the user asks for Chinese review output that preserves technical terms across coding-agent platforms, terminal workflows, and CI bots.
---

# Strict Code Review

Use this skill for a demanding review focused on implementation quality, maintainability, abstraction quality, and codebase health.

Push beyond local cleanup. Actively search for structural simplifications that preserve behavior while making the implementation smaller, more direct, easier to test, and easier to reason about.

## Language Policy

Default to Simplified Chinese for review prose, explanations, verdicts, and chat summaries unless the user requests another language.

Preserve professional terms in English when English is more precise, more searchable, or already standard in the codebase. Do not force awkward Chinese translations.

Keep these categories in English by default:

- Identifiers, filenames, paths, package names, CLI commands, config keys, APIs, database fields, env vars, log fields, metrics, protocol names, library/framework names, model/tool names, and product names.
- Common engineering terms whose English form is the practical term of art, such as \`diff\`, \`PR\`, \`commit\`, \`merge-base\`, \`runtime\`, \`fallback\`, \`cache\`, \`schema\`, \`state machine\`, \`type guard\`, \`dispatcher\`, \`middleware\`, \`service\`, \`adapter\`, \`boundary\`, \`contract\`, \`orchestration\`, \`rollback\`, \`atomic\`, \`idempotency\`, \`fixture\`, and \`snapshot\`.
- Severity and report labels: \`Blocker\`, \`Strong\`, \`Polish\`, \`Approve\`, \`Approve with nits\`, \`Request Changes\`.

Use Chinese for the reasoning around those terms. If a Chinese explanation helps on first use, write \`中文说明 (English term)\` once, then use the English term consistently.

Extend this rule to new domains: preserve the original professional term when translation would reduce precision, hurt searchability, hide the connection to code, or create an uncommon phrase. Translate only generic connective language and concepts with stable, widely understood Chinese names.

Quote source snippets exactly as they appear in files. Do not translate code, comments, strings, identifiers, or log fields inside quoted snippets.

## Platform Compatibility

This skill must work across coding-agent platforms. Do not assume any single runtime, tool home directory, shell integration, or agent-specific directive.

Use the tools available in the current environment:

- Prefer \`git\`, \`rg\`, and ordinary shell/file operations when available.
- If no shell is available, inspect the files or diff the platform exposes.
- If no filesystem write access is available, produce a chat-only review and say the HTML report could not be written.
- Do not hardcode platform-specific paths or tool-specific home directories.
- Read \`reference_report.html\` next to this \`SKILL.md\` when the platform exposes the skill folder. If the sibling file is unavailable, recreate the same report structure from the "Output Format" section below.

Repository detection:

- If inside a git repository, use the repository root as the workspace root.
- If not inside a git repository, use the current workspace or provided files as the review scope and skip HTML generation only when a report path cannot be written safely.
- Determine the current branch with \`git branch --show-current\` when possible; fall back to \`detached\`, \`unknown\`, or a user-provided scope label.

## Core Review Prompt

Start from this baseline:

> Perform a strict code quality audit of the requested changes.
> Rethink the structure and implementation to improve code quality without changing behavior.
> Improve abstractions, modularity, succinctness, legibility, and boundary clarity.
> Be ambitious where a clearer structure is visible.
> Be thorough and rigorous.

## Review Workflow

1. Establish scope from the user request. If unspecified, review the current branch against the likely target branch (\`main\`, \`master\`, or the merge-base the repository indicates).
2. Inspect the diff and enough surrounding code to understand ownership, invariants, existing helpers, and local style.
3. Prefer findings grounded in real regressions or high-confidence maintainability risks. Avoid low-value nits when structural issues exist.
4. Quote every snippet from a real file and include \`file:line\`.
5. Produce the HTML report when possible, then send a brief chat summary.

## Non-Negotiable Standards

Apply the baseline prompt plus these rules.

1. Be ambitious about structural simplification.
   - Do not stop at "this could be a bit cleaner."
   - Look for opportunities to delete whole branches, helpers, modes, conditionals, or layers.
   - Prefer the structure that makes the code feel obvious after the change.

2. Do not let a PR push a file from under 1000 lines to over 1000 lines without a strong reason.
   - Treat the threshold crossing as a strong code-quality smell by default.
   - Prefer extracting helpers, subcomponents, modules, or local abstractions.
   - If the diff crosses the threshold, explicitly ask whether decomposition should happen first.

3. Do not allow spaghetti growth in existing code.
   - Be suspicious of new ad-hoc conditionals, scattered special cases, and one-off branches inserted into unrelated flows.
   - Treat "another weird if" in a busy path as a design problem.
   - Prefer a dedicated abstraction, helper, state machine, policy object, or module.

4. Bias toward cleaning design, not accepting code only because it works.
   - Push for the cleaner version when behavior can stay the same.
   - Prefer simplifications that remove moving pieces over refactors that spread the same complexity around.

5. Prefer direct, boring, maintainable code over hacky or magical code.
   - Flag brittle, ad-hoc, or magical behavior.
   - Be skeptical of generic mechanisms that hide simple data-shape assumptions.
   - Flag thin wrappers or pass-through helpers that add indirection without clarity.

6. Push on type and boundary cleanliness when they affect maintainability.
   - Question unnecessary optionality, \`unknown\`, \`any\`, casts, and loosely shaped objects.
   - Prefer explicit typed models or shared contracts.
   - If a branch relies on silent fallback to hide an unclear invariant, ask whether the boundary should be explicit.

7. Keep logic in the canonical layer and reuse existing helpers.
   - Call out feature logic leaking into shared paths.
   - Prefer canonical utilities over bespoke one-offs.
   - Push code toward the package, service, module, or layer that owns the concept.

8. Treat unnecessary sequential orchestration and non-atomic updates as design smells when a cleaner structure is visible.
   - If independent work is serialized without a reason, ask whether parallel execution simplifies the flow.
   - If related updates can leave half-applied state, push for a more atomic structure.

## Primary Review Questions

Ask these for every meaningful change:

- Can the change be reframed so fewer concepts, branches, or helper layers are needed?
- Does it improve or worsen the local architecture?
- Did it add branching complexity where a better abstraction should exist?
- Did a cohesive module become more coupled, more stateful, or harder to scan?
- Is the logic living in the right file and layer?
- Did a file or component cross a healthy size boundary?
- Are repeated conditionals signaling a missing model or helper?
- Is the implementation direct and legible, or dependent on special cases and incidental control flow?
- Is the abstraction earning its keep, or just wrapping?
- Did the diff introduce casts, optionality, or ad-hoc shapes that obscure the real invariant?
- Is orchestration more sequential or less atomic than it needs to be?

## What to Flag Aggressively

Escalate findings when you see:

- A complicated implementation where a cleaner reframing can delete meaningful complexity.
- Refactors that move code around without reducing the number of concepts a reader must hold.
- A file crossing 1000 lines because of the PR.
- New conditionals bolted onto unrelated code paths.
- One-off booleans, nullable modes, or flags that complicate existing control flow.
- Feature-specific logic leaking into general-purpose modules.
- Generic handling that hides simple structure.
- Thin wrappers or identity abstractions.
- Unnecessary casts, \`any\`, \`unknown\`, optional params, or stringly typed contracts.
- Copy-pasted logic instead of extracted helpers.
- Narrow edge-case handling in the middle of an already busy function.
- Refactors that pass tests but make the code less modular or less readable.
- Temporary branching likely to become permanent debt.
- Bespoke helpers where the codebase already has a canonical utility.
- Logic in the wrong layer/package.
- Sequential async flow where independent work could be simpler in parallel.
- Partial-update logic that leaves state harder to reason about.

## Preferred Remedies

Prefer suggestions like:

- Delete a layer of indirection instead of polishing it.
- Reframe the state model so conditionals disappear.
- Change ownership boundaries so the feature becomes a natural extension of an existing abstraction.
- Turn special cases into a simpler default flow with fewer exceptions.
- Extract a helper, pure function, component, module, or policy object.
- Split a large file into smaller focused modules.
- Move feature-specific logic behind a dedicated abstraction.
- Replace condition chains with a typed model, explicit dispatcher, or state machine.
- Separate orchestration from business logic.
- Collapse duplicate branches into one clear flow.
- Delete wrappers that do not clarify the API.
- Reuse canonical helpers.
- Make type boundaries explicit.
- Move logic to the package/module/layer that owns the concept.
- Parallelize independent work when it also simplifies orchestration.
- Restructure related updates into a more atomic flow.

## Review Tone

Be direct, serious, and demanding about quality. Do not be rude, but do not soften major maintainability problems into mild suggestions.

Use Chinese prose with preserved technical terms, for example:

- \`这个 diff 把文件推过 1000 lines。这里应该先做 decomposition。\`
- \`这里又往 busy flow 里塞了一个 special-case branch，应该抽到 dedicated abstraction。\`
- \`这段代码能工作，但让 surrounding code 更难维护。建议保持 behavior，重做 structure。\`
- \`这里像是 feature logic leaking into shared path。应该隔离 ownership boundary。\`
- \`这个 wrapper 没有带来 clarity，可以保留 direct flow。\`
- \`为什么这里需要 cast / optional？能不能把 boundary contract 显式化？\`
- \`这像是已有 canonical helper 的 near-duplicate。应该复用现有 helper。\`

## Output Expectations

Prioritize findings in this order:

1. Structural code-quality regressions
2. Missed opportunities for major simplification
3. Spaghetti / branching complexity increases
4. Boundary / abstraction / type-contract problems
5. File-size and decomposition concerns
6. Modularity and abstraction issues
7. Legibility and maintainability concerns

Prefer a smaller number of high-conviction comments over a long list of cosmetic notes.

## Output Format - HTML Report

Every run should produce a self-contained HTML report file when the environment allows writing files. Chat output should be a brief verdict summary; the full review lives in the HTML.

The quality bar: "skim once and understand." Each finding card must let a reader understand the problem, location, and proposed fix without scrolling elsewhere.

### File location

- Path: \`docs/strict_codereview_<branch>_<YYYY-MM-DD>.html\`
- Sanitize branch name: replace \`/\`, \`\\\`, whitespace, and unsafe filename characters with \`_\`.
- If the file exists, suffix \`_rev02\`, \`_rev03\`, etc.
- Create \`docs/\` if missing.
- If not in a git repository and no safe workspace path is known, skip HTML generation and use chat-only output.

### Reference template

Use \`reference_report.html\` beside this \`SKILL.md\` as the visual skeleton:

- Self-contained single HTML file with inlined CSS and optional highlight.js CDN.
- Top: branch metadata, verdict banner, scope cards, severity stat pills.
- Left sidebar: sticky TOC grouped by \`Blocker\`, \`Strong\`, \`Polish\`.
- Each finding is a card with severity badge, \`Fn\` id, title, \`file:line\` location, problem statement, current-code snippet, proposed fix.
- Bottom: approval verdict section.

The template is intentionally generic. Replace all placeholder content with real review content.

### Hard rules for report content

1. Each finding card must be self-contained and skimmable in one pass.
   - Lead with a one-sentence problem statement.
   - Keep code snippets under about 15 lines.
   - Use inline comments inside snippets, such as \`// <- here\`, to point at the issue.
   - Do not rely on "see F3 above" style cross-references.
   - Use a visual artifact when comparison helps: ASCII, table, styled mini-UI, SVG, or another compact inline form.

2. Every \`Blocker\` must include a visual mockup inside \`<figure class="mockup">\` showing current vs proposed.
   - Prefer \`.mockup-grid\` with \`.mockup-card.bad\` and \`.mockup-card.good\` wrappers.
   - Use another layout only when it communicates the contrast faster.

3. Every code snippet must be quoted from a real file with \`file:line\`.
   - Read the file before quoting.
   - HTML-escape \`<\`, \`>\`, and \`&\` inside \`<code>\` blocks.
   - Proposed snippets may be pseudocode only when clearly labeled as proposed.

4. Group findings strictly by severity: \`Blocker\`, then \`Strong\`, then \`Polish\`.

5. TOC must mirror the severity grouping with colored dots.

6. Verdict banner must say one of: \`Approve\`, \`Approve with nits\`, \`Request Changes\`.
   - Any report with at least one \`Blocker\` is \`Request Changes\`.
   - \`Approve with nits\` is only for minor \`Polish\` findings.

### Chat output after writing HTML

Keep it under about 10 lines:

- HTML report path
- Verdict and counts: \`N Blocker / M Strong / K Polish\`
- Top 1 to 3 \`Blocker\` titles
- Nothing else; the full detail lives in the HTML

## Approval Bar

Do not approve merely because behavior seems correct.

Approve only when there is:

- no clear structural regression
- no obvious missed opportunity for major simplification
- no unjustified file-size explosion
- no obvious spaghetti growth from special-case branching
- no hacky or magical abstraction that makes the code harder to reason about
- no unnecessary wrapper/cast/optionality churn obscuring the real design
- no clear architecture-boundary leak or avoidable canonical-helper duplication
- no missed obvious decomposition that would materially improve maintainability

Treat these as presumptive \`Blocker\` findings unless the author can justify them clearly:

- The PR preserves a lot of incidental complexity when a plausible simplification would delete it.
- The PR pushes a file from below 1000 lines to above 1000 lines.
- The PR adds ad-hoc branching that makes an existing flow more tangled.
- The PR solves a local problem by scattering feature checks across shared code.
- The PR adds an unnecessary abstraction, wrapper, or cast-heavy contract that makes the design more indirect.
- The PR duplicates an existing helper or puts logic in the wrong layer when a clear canonical home exists.
`

export { SKILL_MD }
