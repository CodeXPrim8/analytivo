import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/db'
import { parseUserAgent, referrerSource, visitorIdFrom } from '@/lib/tracking'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ alias: string }> },
) {
  const { alias } = await context.params
  const link = await prisma.link.findUnique({ where: { alias } })

  if (!link) {
    return NextResponse.redirect(new URL('/?error=link-not-found', request.url))
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/?error=link-expired', request.url))
  }

  const ua = request.headers.get('user-agent') || ''
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  const referrer = request.headers.get('referer')
  const language = request.headers.get('accept-language')?.split(',')[0] || null
  const visitorId = visitorIdFrom(ip, ua)
  const { device, browser, os } = parseUserAgent(ua)
  const source =
    request.nextUrl.searchParams.get('utm_source') ||
    referrerSource(referrer) ||
    link.source ||
    'direct'

  // Record the click after the redirect is sent so visitors don't wait on DB writes.
  after(async () => {
    const prior = await prisma.click.findFirst({
      where: { linkId: link.id, visitorId },
      select: { id: true },
    })

    await prisma.click.create({
      data: {
        linkId: link.id,
        visitorId,
        referrer: referrer || null,
        source,
        device,
        browser,
        os,
        language,
        isReturning: Boolean(prior),
      },
    })
  })

  return NextResponse.redirect(link.originalUrl, { status: 302 })
}
