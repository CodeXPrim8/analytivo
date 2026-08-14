import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CONTACT_TO, contactEmailHtml, emailEnabled, sendEmail } from '@/lib/email'

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.string().trim().email('Enter a valid email').max(120),
  subject: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Tell us a bit more (at least 10 characters)').max(4000),
  website: z.string().max(0).optional(),
})

const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs)
  if (recent.length >= 5) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  return false
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Please check the form'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many messages. Please try again shortly.' }, { status: 429 })
  }

  if (!emailEnabled()) {
    return NextResponse.json(
      { error: 'Email sending is not configured on this site yet.' },
      { status: 503 },
    )
  }

  const subject = parsed.data.subject?.trim() || 'Website message'
  const sent = await sendEmail({
    to: CONTACT_TO,
    replyTo: parsed.data.email,
    subject: `[Analytivo] ${subject} — ${parsed.data.name}`,
    html: contactEmailHtml({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      subject: parsed.data.subject,
      company: parsed.data.company,
    }),
  })

  if (!sent.ok) {
    return NextResponse.json({ error: 'Could not send your message. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
