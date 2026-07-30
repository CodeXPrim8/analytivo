import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { shortUrlFor } from '@/lib/links'
import { QRCodesManager } from '@/components/QRCodesManager'

export default async function QRCodesPage() {
  const user = await requireUser()
  const [qrCodes, links] = await Promise.all([
    prisma.qRCode.findMany({
      where: { userId: user.id },
      include: {
        link: {
          include: { _count: { select: { clicks: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, alias: true },
    }),
  ])

  return (
    <QRCodesManager
      initialQRCodes={qrCodes.map((qr) => ({
        id: qr.id,
        linkId: qr.linkId,
        title: qr.link.title,
        shortUrl: shortUrlFor(qr.link.alias),
        scans: qr.link._count.clicks,
        createdAt: qr.createdAt,
      }))}
      links={links.map((l) => ({
        id: l.id,
        title: l.title,
        shortUrl: shortUrlFor(l.alias),
      }))}
    />
  )
}
