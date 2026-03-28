import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const RequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  url: z.string().url('Please enter a valid URL'),
  score: z.number().min(0).max(100),
  checks: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      status: z.enum(['pass', 'warn', 'fail']),
      weight: z.number(),
      message: z.string(),
      fix: z.string().optional(),
    })
  ),
})

function buildEmailHtml(data: z.infer<typeof RequestSchema>): string {
  const statusEmoji = (s: string) =>
    s === 'pass' ? '✅' : s === 'warn' ? '⚠️' : '❌'

  const rows = data.checks
    .map(
      c => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${statusEmoji(c.status)} ${c.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${c.message}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${c.fix ?? '—'}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:24px">
  <h1 style="color:#111827">Your GEO Readiness Report</h1>
  <p style="color:#6b7280">Audited: <strong>${data.url}</strong></p>

  <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
    <div style="font-size:64px;font-weight:700;color:${data.score >= 80 ? '#22c55e' : data.score >= 60 ? '#f59e0b' : data.score >= 40 ? '#f97316' : '#ef4444'}">${data.score}</div>
    <div style="color:#6b7280;font-size:14px">GEO Readiness Score / 100</div>
  </div>

  <h2 style="color:#111827">Detailed Findings</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="text-align:left;padding:8px 12px">Check</th>
        <th style="text-align:left;padding:8px 12px">Finding</th>
        <th style="text-align:left;padding:8px 12px">Fix</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:32px;padding:24px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe">
    <h3 style="margin:0 0 8px;color:#1d4ed8">Ready to fix these issues?</h3>
    <p style="margin:0 0 16px;color:#374151">Our GEO optimization service will implement every fix above — plus advanced AI visibility improvements your competitors haven't discovered yet.</p>
    <a href="https://darlingmartech.com/services/website-ux/geo-optimization"
       style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Get Your Free GEO Optimization Consultation →
    </a>
  </div>

  <p style="margin-top:24px;font-size:12px;color:#9ca3af">
    You're receiving this because you requested your GEO Readiness Report at geo.darlingmartech.com.<br>
    Darling Marketing & Tech · darlingmartech.com
  </p>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    const resend = new Resend(apiKey)
    const { data: emailData, error } = await resend.emails.send({
      from: 'GEO Auditor <geo-auditor@darlingmartech.com>',
      to: parsed.data.email,
      subject: `Your GEO Readiness Score: ${parsed.data.score}/100 — ${parsed.data.url}`,
      html: buildEmailHtml(parsed.data),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: emailData?.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
