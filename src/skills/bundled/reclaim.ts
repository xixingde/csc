import { registerBundledSkill } from '../bundledSkills.js'
import {
  type ReclaimMode,
  filterBodyForMode,
  isReclaimMode,
  resolveReclaimMode,
  setReclaimMode,
} from './reclaimMode.js'

// Transcribed from upstream Ponytail (github.com/DietrichGebert/ponytail,
// skills/ponytail/SKILL.md). Re-sync this body when upstream changes — there is
// no automated drift check; this is a vendored copy, not a live import.
//
// Single source of truth. The Intensity table rows and the cache example are
// the only mode-varying lines; filterBodyForMode trims them per mode. The
// ladder, rules, and guardrails apply to every mode — never branch them.
const RECLAIM_BODY = `# Reclaim — the laziest solution that actually works

Lazy means efficient, not careless. The best code is the code never written.

## The ladder

Before writing any code, stop at the first rung that holds:

1. Does this need to exist at all? Speculative need = skip it, say so in one line. (YAGNI)
2. Stdlib does it? Use it.
3. Native platform feature covers it? \`<input type="date">\` over a picker lib, CSS over JS, a DB constraint over app code.
4. Already-installed dependency solves it? Use it. Never add a new one for what a few lines do.
5. Can it be one line? One line.
6. Only then: the minimum code that works.

Two rungs work -> take the higher one and move on. The first lazy solution that works is the right one.

## Rules

- No unrequested abstractions: no interface with one implementation, no config for a value that never changes.
- No boilerplate or scaffolding "for later" — later can scaffold for itself.
- Deletion over addition. Boring over clever. Fewest files, shortest working diff wins.
- Two stdlib options the same size? Take the edge-case-correct one. Lazy means less code, not the flimsier algorithm.
- Mark deliberate simplifications with a \`reclaim:\` comment naming the ceiling and the upgrade path: \`# reclaim: global lock, per-account locks if throughput matters\`.

## Intensity

| Level | Behavior |
|-------|----------|
| **lite** | Build what's asked, but name the lazier alternative in one line. The user picks. |
| **full** | The ladder enforced. Stdlib and native first. Shortest diff, shortest explanation. |
| **ultra** | YAGNI extremist. Deletion before addition. Ship the one-liner and challenge the rest of the requirement in the same breath. |

Example — "Add a cache for these API responses.":
- lite: Done. FYI: \`functools.lru_cache\` covers this in one line.
- full: \`@lru_cache(maxsize=1000)\` on the fetch fn. Skipped a cache class.
- ultra: No cache until a profiler says so. Then: \`@lru_cache\`.

## When NOT to be lazy

Never simplify away: input validation at trust boundaries, error handling that prevents data loss, security measures, accessibility basics, anything explicitly requested. Leave the calibration knobs real hardware needs. Non-trivial logic leaves ONE runnable check behind — the smallest thing that fails if the logic breaks (an assert-based demo or one small test file). Trivial one-liners need no test.

## Output

Code first, then at most three short lines: what was skipped, when to add it. Pattern: \`[code] -> skipped: [X], add when [Y].\` If the explanation is longer than the code, delete the explanation.
`

function bodyForMode(mode: ReclaimMode): string {
  if (mode === 'off') {
    return 'Reclaim is off. Re-enable with `/reclaim full` (or `lite` / `ultra`).'
  }
  return filterBodyForMode(RECLAIM_BODY, mode)
}

export function registerReclaimSkill(): void {
  registerBundledSkill({
    name: 'reclaim',
    description:
      'Forces the laziest solution that actually works: YAGNI, stdlib and native before custom code, shortest diff. Modes: lite/full/ultra/off.',
    whenToUse:
      'When the user says "be lazy", "simplest/minimal solution", "yagni", "do less", or complains about over-engineering, bloat, boilerplate, or unnecessary dependencies.',
    argumentHint: '[lite|full|ultra|off]',
    userInvocable: true,
    async getPromptForCommand(args) {
      const requested = args.trim().toLowerCase()
      // A recognized mode switches and persists; anything else (bare /reclaim,
      // typo) injects the current effective mode without writing.
      if (isReclaimMode(requested)) {
        setReclaimMode(requested)
        return [{ type: 'text', text: bodyForMode(requested) }]
      }
      return [{ type: 'text', text: bodyForMode(resolveReclaimMode()) }]
    },
  })
}
