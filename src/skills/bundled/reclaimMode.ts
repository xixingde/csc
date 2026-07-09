import {
  getInitialSettings,
  updateSettingsForSource,
} from '../../utils/settings/settings.js'

export type ReclaimMode = 'off' | 'lite' | 'full' | 'ultra'

const MODES: readonly ReclaimMode[] = ['off', 'lite', 'full', 'ultra']
const DEFAULT_MODE: ReclaimMode = 'full'

export function isReclaimMode(value: string): value is ReclaimMode {
  return (MODES as readonly string[]).includes(value)
}

/**
 * env override: highest priority, session-only, never written to disk.
 * Mirrors getEffortEnvOverride (src/utils/effort.ts). The env var follows the
 * codebase's CLAUDE_CODE_* convention (not the design doc's CO_CLAUDE_*).
 */
export function getReclaimModeEnvOverride(): ReclaimMode | undefined {
  const raw = process.env.CLAUDE_CODE_RECLAIM_MODE?.toLowerCase()
  return raw && isReclaimMode(raw) ? raw : undefined
}

/** Resolution order: env > settings.reclaimMode > 'full'. */
export function resolveReclaimMode(): ReclaimMode {
  return (
    getReclaimModeEnvOverride() ??
    getInitialSettings().reclaimMode ??
    DEFAULT_MODE
  )
}

/** Persist a mode globally to user settings (mirrors /effort persistence). */
export function setReclaimMode(mode: ReclaimMode): { error: Error | null } {
  return updateSettingsForSource('userSettings', { reclaimMode: mode })
}

/**
 * Trim mode-varying rows so one BODY serves every mode without branching.
 * A table row (`| **lite** | ... |`) or example line (`- lite: ...`) whose
 * first label is a mode is kept only when it equals `mode`; every other line
 * is kept verbatim — the ladder, rules, and guardrails never vary by mode.
 */
export function filterBodyForMode(body: string, mode: ReclaimMode): string {
  const labelRe = /^\s*(?:\|\s*\*\*|-\s+)(off|lite|full|ultra)\b/
  return body
    .split('\n')
    .filter(line => {
      const match = line.match(labelRe)
      return match ? match[1] === mode : true
    })
    .join('\n')
}
