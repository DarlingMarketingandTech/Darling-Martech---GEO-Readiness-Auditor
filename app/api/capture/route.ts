/**
 * POST /api/capture
 *
 * Body:  { email: string, auditData: AuditResult }
 * Returns: { success: boolean, message: string }
 *
 * Sends a full GEO Readiness Report to the user via Resend.
 * Rate limit: 5 emails / hour per IP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { SITE_ORIGIN, SITE_HOSTNAME, geoOptimizationUrl } from '@/lib/site'

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const CheckResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['pass', 'warn', 'fail']),
  weight: z.number().min(0).max(100),
  message: z.string(),
  fix: z.string().optional(),
})

const AuditResultSchema = z.object({
  url: z.string().url(),
  score: z.number().min(0).max(100),
  checks: z.array(CheckResultSchema).min(1),
  summary: z.string(),
  fetchedAt: z.string(),
})

const RequestSchema = z.object({
  email: z.preprocess(
    val => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    z.string().email('Please enter a valid email address')
  ),
  auditData: AuditResultSchema,
})

type CaptureRequest = z.infer<typeof RequestSchema>
type CheckResult = z.infer<typeof CheckResultSchema>

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

const SCORE_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  good: '#f59e0b',
  needs_work: '#f97316',
  critical: '#ef4444',
}

function scoreColor(score: number): string {
  if (score >= 80) return SCORE_COLORS.excellent
  if (score >= 60) return SCORE_COLORS.good
  if (score >= 40) return SCORE_COLORS.needs_work
  return SCORE_COLORS.critical
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent GEO Readiness'
  if (score >= 60) return 'Good Foundation'
  if (score >= 40) return 'Needs Improvement'
  return 'Critical Issues Found'
}

function statusIcon(status: string): string {
  return status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌'
}

function statusBg(status: string): string {
  return status === 'pass' ? '#f0fdf4' : status === 'warn' ? '#fffbeb' : '#fef2f2'
}

function statusBorder(status: string): string {
  return status === 'pass' ? '#bbf7d0' : status === 'warn' ? '#fde68a' : '#fecaca'
}

/** Returns checks sorted: fail first, then warn, then pass */
function sortedChecks(checks: CheckResult[]): CheckResult[] {
  const order = { fail: 0, warn: 1, pass: 2 }
  return [...checks].sort((a, b) => order[a.status] - order[b.status])
}

/** Prioritised fix list — fails first, then warns, skipping passes */
function prioritizedFixes(checks: CheckResult[]): CheckResult[] {
  return sortedChecks(checks).filter(c => c.fix)
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function buildEmailHtml(data: CaptureRequest): string {
  const { email, auditData } = data
  const { url, score, checks, summary, fetchedAt } = auditData
  const domain = domainFromUrl(url)
  const color = scoreColor(score)
  const label = scoreLabel(score)
  const fixes = prioritizedFixes(checks)
  const sorted = sortedChecks(checks)
  const auditDate = new Date(fetchedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const checkRows = sorted
    .map(
      c => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;vertical-align:top">
          <div style="display:inline-flex;align-items:center;gap:6px">
            <span style="font-size:16px;line-height:1">${statusIcon(c.status)}</span>
            <strong style="font-size:13px;color:#111827">${c.label}</strong>
          </div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;vertical-align:top">
          ${c.message}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;vertical-align:top">
          ${c.weight}
        </td>
      </tr>`
    )
    .join('')

  const fixItems = fixes.length > 0
    ? fixes
        .map(
          (c, i) => `
        <div style="display:flex;gap:12px;margin-bottom:${i < fixes.length - 1 ? '16' : '0'}px">
          <div style="flex-shrink:0;width:24px;height:24px;border-radius:50%;
                      background:${statusBg(c.status)};border:1px solid ${statusBorder(c.status)};
                      display:flex;align-items:center;justify-content:center;
                      font-size:11px;font-weight:700;color:${c.status === 'fail' ? '#dc2626' : '#d97706'};
                      line-height:24px;text-align:center">
            ${i + 1}
          </div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:2px">${c.label}</div>
            <div style="font-size:13px;color:#374151">${c.fix}</div>
          </div>
        </div>`
        )
        .join('')
    : '<p style="color:#6b7280;font-size:13px;margin:0">No critical fixes needed — great work!</p>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your GEO Readiness Report for ${domain}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%);padding:32px 40px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#93c5fd;text-transform:uppercase">
              Darling Marketing &amp; Tech
            </p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.2">
              Your GEO Readiness Report
            </h1>
            <p style="margin:0;font-size:14px;color:#bfdbfe">
              ${domain} &nbsp;·&nbsp; Audited ${auditDate}
            </p>
          </td>
        </tr>

        <!-- Score block -->
        <tr>
          <td style="padding:40px 40px 0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f8fafc;border-radius:12px;padding:32px;text-align:center;border:2px solid ${color}22">
                  <div style="font-size:72px;font-weight:800;color:${color};line-height:1">${score}</div>
                  <div style="font-size:14px;color:#6b7280;margin:4px 0 12px">out of 100</div>
                  <div style="display:inline-block;background:${color}18;border:1px solid ${color}44;
                               border-radius:20px;padding:4px 16px;font-size:13px;font-weight:600;color:${color}">
                    ${label}
                  </div>
                </td>
              </tr>
            </table>

            <p style="font-size:15px;color:#374151;margin:24px 0 0;line-height:1.6;padding:16px 20px;
                       background:#f1f5f9;border-left:4px solid #2563eb;border-radius:0 8px 8px 0">
              ${summary}
            </p>
          </td>
        </tr>

        <!-- Prioritized Fixes -->
        <tr>
          <td style="padding:32px 40px 0">
            <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 20px">
              🔧 Prioritized Fixes (${fixes.length} action${fixes.length !== 1 ? 's' : ''})
            </h2>
            ${fixItems}
          </td>
        </tr>

        <!-- Full check breakdown -->
        <tr>
          <td style="padding:32px 40px 0">
            <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px">
              📊 Full Audit Breakdown
            </h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-radius:8px;overflow:hidden;border:1px solid #f3f4f6">
              <thead>
                <tr style="background:#f9fafb">
                  <th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #f3f4f6">
                    Check
                  </th>
                  <th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #f3f4f6">
                    Finding
                  </th>
                  <th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #f3f4f6">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>${checkRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:32px 40px">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:0">
              <tr>
                <td style="padding:28px 32px">
                  <h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1d4ed8">
                    Ready to fix every issue above?
                  </h3>
                  <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6">
                    Our GEO Optimization service implements every fix in this report — plus advanced
                    AI visibility techniques your competitors haven&rsquo;t discovered yet. Most clients
                    see measurable improvements in AI citation rates within 30 days.
                  </p>
                  <a href="${geoOptimizationUrl()}"
                     style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;
                            border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
                    Get Your Free GEO Optimization Consultation →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #f3f4f6;padding:20px 40px;background:#f9fafb">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af">
              You requested this report at
              <a href="${SITE_ORIGIN}" style="color:#6b7280">${SITE_HOSTNAME}</a>
              using <strong>${email}</strong>.
            </p>
            <p style="margin:0;font-size:12px;color:#9ca3af">
              Darling Marketing &amp; Tech &middot;
              <a href="${SITE_ORIGIN}" style="color:#6b7280">${SITE_HOSTNAME}</a>
            </p>
          </td>
        </tr>

      </table><!-- /Card -->

    </td></tr>
  </table><!-- /Wrapper -->

</body>
</html>`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Rate limit
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, 'capture')

  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many email requests. Please wait ${Math.ceil(rl.resetIn / 60)} minute(s) before requesting another report.`,
        resetIn: rl.resetIn,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.resetIn),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + rl.resetIn),
        },
      }
    )
  }

  // 2. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      {
        success: false,
        message: firstIssue?.message ?? 'Invalid request',
        details: parsed.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 }
    )
  }

  const data = parsed.data as CaptureRequest

  // 3. Check Resend is configured
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_your_key_here') {
    console.error('[capture] RESEND_API_KEY not configured')
    return NextResponse.json(
      { success: false, message: 'Email service is not configured. Please contact us directly.' },
      { status: 503 }
    )
  }

  // 4. Send email
  try {
    const resend = new Resend(apiKey)
    const domain = domainFromUrl(data.auditData.url)

    const resendFrom =
      process.env.RESEND_FROM ?? 'GEO Auditor <onboarding@resend.dev>'

    const { data: emailData, error } = await resend.emails.send({
      from: resendFrom,
      to: data.email,
      subject: `Your GEO Readiness Report for ${domain} — Score: ${data.auditData.score}/100`,
      html: buildEmailHtml(data),
      // Plain-text fallback
      text: [
        `Your GEO Readiness Report for ${domain}`,
        `Score: ${data.auditData.score}/100 — ${scoreLabel(data.auditData.score)}`,
        '',
        data.auditData.summary,
        '',
        '=== AUDIT FINDINGS ===',
        ...sortedChecks(data.auditData.checks).map(
          c => `${statusIcon(c.status)} ${c.label}: ${c.message}${c.fix ? `\n   → Fix: ${c.fix}` : ''}`
        ),
        '',
        'Ready to fix these issues?',
        geoOptimizationUrl(),
        '',
        '---',
        `Darling Marketing & Tech · ${SITE_HOSTNAME}`,
      ].join('\n'),
    })

    if (error) {
      console.error('[capture] Resend error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send the report email. Please try again or contact us directly.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Your GEO Readiness Report has been sent to ${data.email}.`,
      emailId: emailData?.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[capture] Unexpected error:', message)
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while sending your report. Please try again.',
      },
      { status: 500 }
    )
  }
}
