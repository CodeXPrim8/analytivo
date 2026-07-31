type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

/**
 * Sends transactional mail through Resend when configured.
 * Callers must still surface a copyable link, since delivery is optional.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false as const, error: 'Email delivery is not configured' }

  const from = process.env.EMAIL_FROM?.trim() || 'Analytivo <onboarding@resend.dev>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Resend rejects requests without a User-Agent with a 403.
        'User-Agent': 'Analytivo/1.0',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false as const, error: `Email provider error ${res.status}: ${body.slice(0, 200)}` }
    }

    return { ok: true as const }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Could not reach the email provider',
    }
  }
}

export function inviteEmailHtml(opts: {
  inviterName: string
  workspaceName: string
  role: string
  inviteUrl: string
}) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0a0e27;padding:32px;color:#e6e8f0">
    <div style="max-width:520px;margin:0 auto;background:#111634;border:1px solid #23294d;border-radius:14px;padding:32px">
      <h1 style="margin:0 0 12px;font-size:22px;color:#ffffff">You've been invited to Analytivo</h1>
      <p style="margin:0 0 20px;line-height:1.6;color:#aab0cb">
        <strong style="color:#ffffff">${escapeHtml(opts.inviterName)}</strong> invited you to join the
        <strong style="color:#ffffff">${escapeHtml(opts.workspaceName)}</strong> workspace as
        <strong style="color:#ffffff">${escapeHtml(opts.role)}</strong>.
      </p>
      <a href="${opts.inviteUrl}"
         style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#06b6d4);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">
        Accept invitation
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#7b81a0;line-height:1.6">
        Or paste this link into your browser:<br />
        <span style="color:#06b6d4;word-break:break-all">${opts.inviteUrl}</span>
      </p>
    </div>
  </div>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
