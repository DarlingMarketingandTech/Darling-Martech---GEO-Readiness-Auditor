/**
 * POST /api/audit
 *
 * Body:  { url: string }
 * Returns: AuditResult (score, checks, summary, url, fetchedAt)
 *
 * Rate limit: 10 requests / hour per IP (via lib/rate-limiter.ts)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runAudit } from '@/lib/auditor'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const RequestSchema = z.object({
  url: z
    .preprocess(
      val => (typeof val === 'string' ? val.trim() : val),
      z
        .string()
        .min(1, 'url cannot be empty')
        .refine(
          val => {
            try {
              const u = new URL(val as string)
              return u.protocol === 'http:' || u.protocol === 'https:'
            } catch {
              return false
            }
          },
          { message: 'Please enter a valid URL starting with http:// or https://' }
        )
    ),
})

type AuditRequest = z.infer<typeof RequestSchema>

// ---------------------------------------------------------------------------
// Error categorisation — surface friendly messages to the client
// ---------------------------------------------------------------------------

type AuditErrorCode =
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'FETCH_FAILED'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'INTERNAL_ERROR'

function classifyError(err: unknown): { code: AuditErrorCode; message: string } {
  if (!(err instanceof Error)) {
    return { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  }

  const msg = err.message.toLowerCase()

  if (msg.includes('timeout') || msg.includes('timed out') || err.name === 'TimeoutError') {
    return {
      code: 'TIMEOUT',
      message: 'The target URL took too long to respond (>15 s). Check that the site is live and publicly accessible.',
    }
  }

  if (
    msg.includes('failed to fetch') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('network')
  ) {
    return {
      code: 'FETCH_FAILED',
      message: 'Could not reach the URL. Make sure the site is publicly accessible and not behind a login.',
    }
  }

  if (msg.includes('parse') || msg.includes('json') || msg.includes('invalid')) {
    return { code: 'PARSE_ERROR', message: `Failed to parse the page: ${err.message}` }
  }

  // Propagate auditor-thrown messages directly (e.g. "Failed to fetch … 403")
  return { code: 'FETCH_FAILED', message: err.message }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, 'audit')

  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. You can run ${10} audits per hour. Please try again in ${Math.ceil(rl.resetIn / 60)} minute(s).`,
        code: 'RATE_LIMITED',
        resetIn: rl.resetIn,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + rl.resetIn),
          'Retry-After': String(rl.resetIn),
        },
      }
    )
  }

  // 2. Parse + validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_REQUEST' },
      { status: 400 }
    )
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      {
        error: firstIssue?.message ?? 'Invalid request',
        code: 'INVALID_REQUEST',
        details: parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 }
    )
  }

  const { url } = parsed.data as AuditRequest

  // 3. Run the audit
  try {
    const result = await runAudit(url)

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + rl.resetIn),
        // Short cache — enough to prevent duplicate runs on page refresh
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (err: unknown) {
    const { code, message } = classifyError(err)
    const httpStatus = code === 'TIMEOUT' ? 504 : code === 'FETCH_FAILED' ? 502 : 500

    return NextResponse.json({ error: message, code }, { status: httpStatus })
  }
}
