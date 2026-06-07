/**
 * Training data trajectory storage.
 *
 * Persists each LLM turn's full input (system prompt + messages) and output
 * (assistant messages) to a per-session JSONL file under .train_collect_trajectory
 * in the project root. This data is intended for supervised fine-tuning.
 *
 * File layout:
 *   Main agent:  <cwd>/.train_collect_trajectory/training_<sessionId>.jsonl
 *   Sub-agent:   <cwd>/.train_collect_trajectory/training_<sessionId>/training_<agentType-N>.jsonl
 *
 * Each file starts with a model entry ({"type":"model","model":"..."}) followed
 * by one turn entry per LLM call.
 *
 * Forked sub-agents (agentType === "fork") are intentionally excluded.
 *
 * Enable with CSC_COLLECT_TRAINING_TRAJECTORY=1 (see docs/features/training-trajectory.md).
 */
import { appendFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { getOriginalCwd, getSessionId } from '../bootstrap/state.js'
import type { NonNullableUsage } from '../services/api/logging.js'
import type {
  AssistantMessage,
  UserMessage,
} from '../types/message.js'
import type { AgentId } from '../types/ids.js'
import { isEnvTruthy } from './envUtils.js'
import { logError } from './log.js'
import {
  allocateAgentDisplayName,
  getAgentDisplayName,
} from './sessionStorage.js'

export const FORK_SUBAGENT_TYPE = 'fork'

const TRAINING_TRAJECTORY_ENV = 'CSC_COLLECT_TRAINING_TRAJECTORY'

/** Whether training trajectory JSONL collection is enabled for this process. */
export function isTrainingTrajectoryCollectionEnabled(): boolean {
  return isEnvTruthy(process.env[TRAINING_TRAJECTORY_ENV])
}

/** Base directory for training trajectory files. */
export function getTrainCollectBaseDir(): string {
  return join(getOriginalCwd(), '.train_collect_trajectory')
}

/**
 * Returns the JSONL file path for training data.
 *
 * @param agentDisplayName - The agentType-N display name (e.g. "explore-1").
 *   Pass undefined for the main agent.
 */
export function getTrainingFilePath(agentDisplayName?: string): string {
  const sessionId = getSessionId()
  if (agentDisplayName) {
    return join(
      getTrainCollectBaseDir(),
      `training_${sessionId}`,
      `training_${agentDisplayName}.jsonl`,
    )
  }
  return join(getTrainCollectBaseDir(), `training_${sessionId}.jsonl`)
}

// ---------------------------------------------------------------------------
// Per-agent state — reset on process restart (intentional: each run is fresh)
// ---------------------------------------------------------------------------

/** Agents whose model entry has already been written to the trajectory file. */
const recordedModelKeys = new Set<string>()

/**
 * Cumulative token consumption per agent/session.
 * Key: agentDisplayName for sub-agents, sessionId for the main agent.
 * Value: total (input_tokens + output_tokens) across all turns so far.
 */
const cumulativeTokens = new Map<string, number>()

/** Stable key used to identify an agent across turns. */
function agentKey(agentDisplayName?: string): string {
  return agentDisplayName ?? getSessionId()
}

/** Resolve display name for training file paths (sub-agents only). */
export function resolveTrainingAgentDisplayName(
  agentId?: AgentId,
  agentType?: string,
): string | undefined {
  if (!agentId) return undefined
  const existing = getAgentDisplayName(agentId)
  if (existing) return existing
  if (agentType) return allocateAgentDisplayName(agentId, agentType)
  return undefined
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type TrainingEntry = {
  /**
   * The fully-assembled system prompt sent to the API.
   * Includes all components added in queryModel: attribution header,
   * CLI sysprompt prefix, agent-specific prompt, advisor instructions, etc.
   */
  system: string[]
  /**
   * The exact message list sent to the API after all normalizations:
   * normalizeMessagesForAPI (attachment expansion, merging, etc.),
   * ensureToolResultPairing, stripAdvisorBlocks, stripExcessMediaItems,
   * and any deferred-tools prepend. Does NOT include cache_control markers
   * (addCacheBreakpoints) since those are caching metadata, not content.
   */
  messages: (UserMessage | AssistantMessage)[]
  /**
   * The full tool definitions sent to the API as the top-level `tools` field.
   * Includes all built-in tools plus any MCP/extra tool schemas.
   */
  tools: BetaToolUnion[]
  /** Assistant messages produced during this streaming turn. */
  output: AssistantMessage[]
  /**
   * Cumulative tokens consumed by this agent/session up to and including
   * this turn: sum of (input_tokens + output_tokens) for every API call so
   * far. Sub-agents have their own independent counter.
   */
  cumulative_tokens: number
}

/**
 * Write the model name as the very first entry in the trajectory file.
 * Called at most once per agent per process lifetime.
 */
export async function recordTrajectoryModel(
  model: string,
  agentType: string | undefined,
  agentDisplayName?: string,
): Promise<void> {
  if (!isTrainingTrajectoryCollectionEnabled()) return
  if (agentType === FORK_SUBAGENT_TYPE) return

  const key = agentKey(agentDisplayName)
  if (recordedModelKeys.has(key)) return
  recordedModelKeys.add(key)

  const filePath = getTrainingFilePath(agentDisplayName)
  const line = JSON.stringify({ type: 'model', model }) + '\n'
  try {
    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 })
    await appendFile(filePath, line, { mode: 0o600 })
  } catch (e) {
    logError(e)
  }
}

/**
 * Append one LLM turn (input + output) to the training JSONL file.
 *
 * The call is fire-and-forget safe: errors are logged but never thrown.
 * Skip entirely for forked sub-agents.
 */
export async function appendTrainingEntry(
  entry: Omit<TrainingEntry, 'cumulative_tokens'>,
  agentType: string | undefined,
  agentDisplayName?: string,
): Promise<void> {
  if (!isTrainingTrajectoryCollectionEnabled()) return
  if (agentType === FORK_SUBAGENT_TYPE) return

  const lastUsage = entry.output.at(-1)?.message.usage as
    | NonNullableUsage
    | undefined
  const turnTokens = lastUsage
    ? (lastUsage.input_tokens ?? 0) +
      (lastUsage.output_tokens ?? 0) +
      (lastUsage.cache_read_input_tokens ?? 0) +
      (lastUsage.cache_creation_input_tokens ?? 0)
    : 0

  const key = agentKey(agentDisplayName)
  const previous = cumulativeTokens.get(key) ?? 0
  const cumulative = previous + turnTokens
  cumulativeTokens.set(key, cumulative)

  const fullEntry: TrainingEntry = { ...entry, cumulative_tokens: cumulative }
  const filePath = getTrainingFilePath(agentDisplayName)
  const line = JSON.stringify(fullEntry) + '\n'
  try {
    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 })
    await appendFile(filePath, line, { mode: 0o600 })
  } catch (e) {
    logError(e)
  }
}

export type TrainingTrajectoryCaptureContext = {
  model: string
  system: string[]
  messages: (UserMessage | AssistantMessage)[]
  tools: BetaToolUnion[]
  agentType?: string
  agentDisplayName?: string
}

function isAssistantStreamMessage(
  item: unknown,
): item is AssistantMessage {
  return (
    item !== null &&
    typeof item === 'object' &&
    'type' in item &&
    (item as { type: string }).type === 'assistant'
  )
}

/**
 * Wraps a model streaming generator to record training trajectory when enabled.
 */
export async function* yieldWithTrainingTrajectory<T>(
  source: AsyncIterable<T>,
  ctx: TrainingTrajectoryCaptureContext,
): AsyncGenerator<T, void> {
  if (!isTrainingTrajectoryCollectionEnabled()) {
    yield* source
    return
  }

  void recordTrajectoryModel(ctx.model, ctx.agentType, ctx.agentDisplayName)

  const output: AssistantMessage[] = []
  for await (const item of source) {
    if (isAssistantStreamMessage(item)) {
      output.push(item)
    }
    yield item
  }

  if (output.length > 0) {
    void appendTrainingEntry(
      {
        system: ctx.system,
        messages: ctx.messages,
        tools: ctx.tools,
        output,
      },
      ctx.agentType,
      ctx.agentDisplayName,
    )
  }
}
