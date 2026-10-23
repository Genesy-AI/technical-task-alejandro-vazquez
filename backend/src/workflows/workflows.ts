import { proxyActivities } from '@temporalio/workflow'
import type * as activities from './activities'

const { verifyEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
  retry: {
    initialInterval: '1 second',
    maximumAttempts: 3,
  },
})

export async function verifyEmailWorkflow(email: string): Promise<boolean> {
  return await verifyEmail(email)
}
