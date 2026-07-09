import { registerBundledSkill } from '../bundledSkills.js'

// One-shot cheat sheet. Does not change the mode or write anything.
const HELP_PROMPT = `# Reclaim — quick reference

Reclaim makes the agent reach for the laziest solution that actually works:
YAGNI, stdlib and native before custom code, the shortest diff that holds.

## Levels

| Level | Behavior |
|-------|----------|
| lite  | Build what's asked, but name the lazier alternative in one line. |
| full  | The ladder enforced. Stdlib and native first. Default. |
| ultra | YAGNI extremist. Deletion before addition. |
| off   | Stop applying Reclaim this session. |

Switch with \`/reclaim lite\`, \`/reclaim full\`, \`/reclaim ultra\`, \`/reclaim off\`.
Bare \`/reclaim\` injects the current level's guidance.

## Commands

- \`/reclaim [lite|full|ultra|off]\` — set the level (persists) or inject the current one.
- \`/reclaim-review\` — review the current diff for over-engineering (reports, no fixes).
- \`/reclaim-audit\` — audit the whole repo for over-engineering.
- \`/reclaim-debt\` — harvest \`reclaim:\` comments into a debt ledger.
- \`/reclaim-help\` — this card.

## Configure the default level

Reclaim applies when you invoke it — \`/reclaim\` (or \`/reclaim-review\`, \`-audit\`,
\`-debt\`). It does not inject on every turn; the level below only controls what a
bare \`/reclaim\` injects, not unprompted responses.

Resolution order: env \`CLAUDE_CODE_RECLAIM_MODE\` > settings \`reclaimMode\` > \`full\`.

- Session-only: \`export CLAUDE_CODE_RECLAIM_MODE=ultra\` (wins for this shell, never written to disk).
- Persistent: \`/reclaim ultra\` writes \`reclaimMode\` to your user settings.json.
`

export function registerReclaimHelpSkill(): void {
  registerBundledSkill({
    name: 'reclaim-help',
    description:
      'Show the Reclaim quick reference: levels, commands, and how to configure the default mode. Changes nothing.',
    whenToUse:
      'When the user asks for "reclaim help", "what reclaim commands", or "how do I use reclaim".',
    userInvocable: true,
    async getPromptForCommand() {
      return [{ type: 'text', text: HELP_PROMPT }]
    },
  })
}
