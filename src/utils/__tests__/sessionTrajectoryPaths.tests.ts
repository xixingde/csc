import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('sessionStorage trajectory paths', () => {
  let prevCwd: string

  beforeEach(async () => {
    prevCwd = process.cwd()
    const dir = await mkdtemp(join(tmpdir(), 'csc-session-traj-'))
    process.chdir(dir)
  })

  afterEach(async () => {
    process.chdir(prevCwd)
  })

  test('getSessionTrajectoryDir points under project root', async () => {
    const { getSessionTrajectoryDir, getTranscriptPath } = await import(
      '../sessionStorage.js'
    )
    const { getSessionId } = await import('../../bootstrap/state.js')

    const base = getSessionTrajectoryDir()
    expect(base).toBe(join(process.cwd(), '.session_trajectory'))
    expect(getTranscriptPath()).toBe(join(base, `${getSessionId()}.jsonl`))
  })

  test('getAgentTranscriptPath uses agentType-N display name', async () => {
    const {
      allocateAgentDisplayName,
      getAgentTranscriptPath,
      getSessionTrajectoryDir,
    } = await import('../sessionStorage.js')
    const { asAgentId } = await import('../../types/ids.js')
    const { getSessionId } = await import('../../bootstrap/state.js')

    const agentId = asAgentId('00000000-0000-4000-8000-000000000099')
    allocateAgentDisplayName(agentId, 'explore')

    expect(getAgentTranscriptPath(agentId)).toBe(
      join(getSessionTrajectoryDir(), getSessionId(), 'explore-1.jsonl'),
    )
  })
})
