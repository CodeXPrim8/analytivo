import { prisma } from '@/lib/db'

export type AppNotification = {
  id: string
  title: string
  body: string
  type: string
  href: string | null
  read: boolean
  createdAt: Date
}

export async function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  })
}

export async function markNotificationRead(userId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  })
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

export async function createNotifications(
  userId: string,
  items: { title: string; body: string; type?: string; href?: string }[],
) {
  if (items.length === 0) return []
  await prisma.notification.createMany({
    data: items.map((item) => ({
      userId,
      title: item.title.slice(0, 120),
      body: item.body.slice(0, 400),
      type: item.type || 'insight',
      href: item.href || '/dashboard/ai-insights',
    })),
  })
  return listNotifications(userId)
}
