import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import path from 'path'
import { randomUUID } from 'crypto'
import { WorkflowFailedError } from '@temporalio/client'
import { TestWorkflowEnvironment } from '@temporalio/testing'
import { Worker } from '@temporalio/worker'
import { verifyEmailWorkflow } from './workflows'

describe('verifyEmailWorkflow', () => {
  let testEnv: TestWorkflowEnvironment

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping()
  }, 120_000)

  afterAll(async () => {
    await testEnv?.teardown()
  })

  const runWorkflow = async (verifyEmail: (email: string) => Promise<boolean>) => {
    const taskQueue = randomUUID()
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: path.join(__dirname, 'workflows.ts'),
      activities: { verifyEmail },
    })
    return worker.runUntil(
      testEnv.client.workflow.execute(verifyEmailWorkflow, {
        taskQueue,
        workflowId: randomUUID(),
        args: ['jane.smith@example.com'],
      })
    )
  }

  it('returns the activity result', async () => {
    await expect(runWorkflow(async () => true)).resolves.toBe(true)
  }, 60_000)

  it('fails instead of retrying forever when the activity keeps timing out', async () => {
    const slowVerifyEmail = () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 6_000))
    await expect(runWorkflow(slowVerifyEmail)).rejects.toBeInstanceOf(WorkflowFailedError)
  }, 60_000)
})
