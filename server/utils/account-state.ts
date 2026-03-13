import prisma from './prisma'

const ACTION_SUSPEND = 'ACCOUNT_SUSPENDED'
const ACTION_UNSUSPEND = 'ACCOUNT_UNSUSPENDED'

export async function isUserSuspended(userId: string): Promise<boolean> {
  const latest = await prisma.auditLog.findFirst({
    where: {
      entity: 'USER',
      entityId: userId,
      action: { in: [ACTION_SUSPEND, ACTION_UNSUSPEND] },
    },
    orderBy: { createdAt: 'desc' },
    select: { action: true },
  })

  return latest?.action === ACTION_SUSPEND
}

export async function setUserSuspendedState(params: {
  adminUserId: string
  userId: string
  suspended: boolean
  reason?: string | null
}) {
  const action = params.suspended ? ACTION_SUSPEND : ACTION_UNSUSPEND

  await prisma.auditLog.create({
    data: {
      userId: params.adminUserId,
      action,
      entity: 'USER',
      entityId: params.userId,
      meta: {
        reason: params.reason?.trim() || null,
      },
    },
  })
}