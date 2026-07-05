/**
 * beta-user-ops.service.ts — Phase 14
 * Operations helper: link beta users with instances, feedback, and sync
 */
import { useBetaUserStore } from '../store/beta-user.store'
import { useBetaInstanceStore } from '@/features/beta/store/beta-instance.store'
import { useFeedbackStore } from '@/features/feedback/store/feedback.store'
import { useCloudSyncStore } from '@/features/cloud-sync/store/cloud-sync.store'

/**
 * Reconcile instance store with beta users:
 * - For each user, tally feedback count and bound instances
 * - Mark relevant entities for cloud sync
 */
export function reconcileUserData() {
  const userStore = useBetaUserStore()
  const instanceStore = useBetaInstanceStore()
  const feedbackStore = useFeedbackStore()
  const syncStore = useCloudSyncStore()

  for (const user of userStore.users) {
    // Tally feedback from this user's instances
    const userInstances = instanceStore.instances.filter(
      inst => user.boundInstanceIds.includes(inst.instanceId),
    )
    const userFeedback = feedbackStore.items.filter(
      fb => fb.sourceInstanceId && user.boundInstanceIds.includes(fb.sourceInstanceId),
    )

    userStore.updateUser(user.betaUserId, {
      feedbackCount: userFeedback.length,
      currentVersion: userInstances.length > 0
        ? userInstances[0].appVersion
        : user.currentVersion,
      lastActiveAt: new Date().toISOString(),
    })

    // Mark for sync
    syncStore.markForUpload('beta_user', user.betaUserId)
  }
}

/**
 * Seed initial beta ops data: users, instances, and link them.
 */
export function seedBetaOpsData() {
  const userStore = useBetaUserStore()
  const instanceStore = useBetaInstanceStore()
  const syncStore = useCloudSyncStore()

  // Seed mock data if not already present
  userStore.seedMockUsers()
  instanceStore.seedMockInstances()

  // Bind the first 2 users to matching instances by convention
  const users = userStore.users
  const instances = instanceStore.instances

  for (let i = 0; i < Math.min(2, users.length, instances.length); i++) {
    const user = users[i]
    const inst = instances[i]
    if (!user.boundInstanceIds.includes(inst.instanceId)) {
      userStore.bindInstance(user.betaUserId, inst.instanceId)
    }
    // Sync mark
    syncStore.markForUpload('beta_user', user.betaUserId)
    syncStore.markForUpload('beta_instance', inst.instanceId)
  }

  // Mark remaining instances for sync
  for (const inst of instances) {
    syncStore.markForUpload('beta_instance', inst.instanceId)
  }
}
