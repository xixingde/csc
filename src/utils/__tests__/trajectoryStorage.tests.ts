import { afterEach, describe, expect, test } from 'bun:test'

describe('trajectoryStorage', () => {
  const originalEnv = process.env.CSC_COLLECT_TRAINING_TRAJECTORY

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CSC_COLLECT_TRAINING_TRAJECTORY
    } else {
      process.env.CSC_COLLECT_TRAINING_TRAJECTORY = originalEnv
    }
  })

  test('isTrainingTrajectoryCollectionEnabled respects env var', async () => {
    const { isTrainingTrajectoryCollectionEnabled } = await import(
      '../trajectoryStorage.js'
    )
    delete process.env.CSC_COLLECT_TRAINING_TRAJECTORY
    expect(isTrainingTrajectoryCollectionEnabled()).toBe(false)
    process.env.CSC_COLLECT_TRAINING_TRAJECTORY = '1'
    expect(isTrainingTrajectoryCollectionEnabled()).toBe(true)
  })

  test('FORK_SUBAGENT_TYPE is fork', async () => {
    const { FORK_SUBAGENT_TYPE } = await import('../trajectoryStorage.js')
    expect(FORK_SUBAGENT_TYPE).toBe('fork')
  })
})
